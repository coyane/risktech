import type { ReactNode } from 'react'

export function SectionCard({
  id,
  title,
  note,
  as: Heading = 'h2',
  children,
}: {
  id: string
  title: string
  note?: ReactNode
  // Nivel del título según dónde se inserte la sección.
  as?: 'h2' | 'h3' | 'h4'
  children: ReactNode
}) {
  return (
    <section id={id} className="card-flush section-card">
      <div className="card-head">
        <Heading className="card-heading">{title}</Heading>
        {note && <div className="card-note">{note}</div>}
      </div>
      {children}
    </section>
  )
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>
}
