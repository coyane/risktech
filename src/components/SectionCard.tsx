import type { ReactNode } from 'react'

export function SectionCard({
  id,
  title,
  note,
  children,
}: {
  id: string
  title: string
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="card-flush section-card">
      <div className="card-head">
        <h2>{title}</h2>
        {note && <div className="card-note">{note}</div>}
      </div>
      {children}
    </section>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>
}
