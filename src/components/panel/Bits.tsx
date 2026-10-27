import type { HTMLAttributes, ReactNode } from 'react'
import type { OperandKind } from '../../lib/calculos'
import { Icon } from '../Icon'

// Cifra grande: la moneda o la unidad va atenuada para que el número se lea primero.
export function BigValue({ display, className = '' }: { display: string; className?: string }) {
  const match = display.match(/^(\$|UF )(.+)$/)
  const unit = display.match(/^(.+?)( UF| UTA)$/)
  return (
    <span className={`pn-big ${className}`}>
      {match ? (
        <>
          <span className="pn-unit">{match[1].trim()}</span>
          {match[2]}
        </>
      ) : unit ? (
        <>
          {unit[1]}
          <span className="pn-unit pn-unit-after">{unit[2]}</span>
        </>
      ) : (
        display
      )}
    </span>
  )
}

// Botón circular que abre el cálculo de una tarjeta.
export function GoLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="pn-go" href={href} aria-label={label}>
      <Icon name="arrow" size={16} />
    </a>
  )
}

// Variación entre años: un dato en texto neutro.
export function Delta({ text }: { text: string | null }) {
  if (!text) return null
  return <span className="pn-delta">{text}</span>
}

// Forma de cada tipo de dato: cuadrado, rombo y círculo. Va siempre con su nombre en texto.
export function KindGlyph({ kind }: { kind: OperandKind }) {
  return (
    <svg className={`pn-glyph pn-glyph-${kind}`} viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
      {kind === 'sii' && <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" />}
      {kind === 'param' && <rect x="3.5" y="3.5" width="9" height="9" rx="1" transform="rotate(45 8 8)" fill="currentColor" />}
      {kind === 'calc' && <circle cx="8" cy="8" r="6" fill="currentColor" />}
    </svg>
  )
}

export function Card({
  className = '',
  children,
  ...rest
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <section className={`pn-card ${className}`} {...rest}>
      {children}
    </section>
  )
}
