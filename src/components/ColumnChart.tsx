import type { CSSProperties } from 'react'

export interface ColumnItem {
  key: string
  label: string
  sublabel: string
  value: number
  // Texto que acompaña al valor, por ejemplo su parte del total.
  detail: string
}

// Columnas para una escala ordenada (tramos). Cada columna lleva su valor escrito,
// así el gráfico se lee sin depender del color ni del alto.
// En pantallas angostas las columnas pasan a barras horizontales.
export function ColumnChart({ items, label, unit }: { items: ColumnItem[]; label: string; unit: [string, string] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ol className="columns" aria-label={label}>
      {items.map((item) => (
        <li key={item.key} style={{ '--ratio': item.value / max } as CSSProperties}>
          <span className="column-plot">
            <span className="column-value">
              {item.value}
              <span className="sr-only"> {item.value === 1 ? unit[0] : unit[1]}</span>
            </span>
            <span className="column-detail">{item.detail}</span>
            <span className="column-bar" />
          </span>
          <span className="column-label">{item.label}</span>
          <span className="column-sub">{item.sublabel}</span>
        </li>
      ))}
    </ol>
  )
}
