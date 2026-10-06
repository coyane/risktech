import type { ReactNode } from 'react'
import type { InsightTone } from '../types'

const toneLabels: Record<InsightTone, string> = {
  positive: 'Positivo',
  neutral: 'Atención',
  review: 'Por validar',
}

export function InsightCard({
  dimension,
  tone,
  title,
  body,
  children,
}: {
  dimension: string
  tone: InsightTone
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <article className="card insight-card">
      <div className="insight-top">
        <div className="insight-dimension">{dimension}</div>
        <span className={`tag tag-${tone}`}>{toneLabels[tone]}</span>
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="insight-foot">{children}</div>
    </article>
  )
}
