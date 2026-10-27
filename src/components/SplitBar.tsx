export interface SplitPart {
  key: string
  label: string
  value: number
  display: string
  tone: 'solid' | 'hatched'
  // Cálculo que produce esta parte.
  href?: string
}

// Parte de un todo con valores exactos: una barra dividida, con monto y porcentaje
// escritos en la leyenda. No depende del color: cada parte lleva su texto.
export function SplitBar({ parts, label }: { parts: SplitPart[]; label: string }) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0)
  if (total <= 0) return null
  const share = (value: number) => Math.max(0, value) / total
  const percent = (value: number) => `${(share(value) * 100).toFixed(1).replace('.', ',')}%`

  return (
    <figure className="split" aria-label={label}>
      <div className="split-bar" aria-hidden="true">
        {parts.map((part) => (
          <span
            key={part.key}
            className={`split-part split-${part.tone}`}
            style={{ width: `${share(part.value) * 100}%` }}
          />
        ))}
      </div>
      <ul className="split-legend">
        {parts.map((part) => (
          <li key={part.key}>
            <span className={`split-swatch split-${part.tone}`} aria-hidden="true" />
            <span className="split-label">{part.href ? <a href={part.href}>{part.label}</a> : part.label}</span>
            <span className="split-value">{part.display}</span>
            <span className="split-share">{percent(part.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
