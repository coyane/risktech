import { useId, useState, type ReactNode } from 'react'

// Sección plegable. El contenido queda en el DOM para que el PDF lo imprima desplegado.
export function Disclosure({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className={`disclosure ${className}`}>
      <button
        type="button"
        className="disclosure-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`disclosure-chevron${open ? ' open' : ''}`} aria-hidden="true">
          ›
        </span>
        {label}
      </button>
      <div id={id} className="disclosure-body" hidden={!open}>
        {children}
      </div>
    </div>
  )
}
