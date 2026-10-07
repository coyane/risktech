import type { ReactNode } from 'react'
import type { Calc } from '../../lib/calculos'
import { Equation } from './Equation'
import { StatusTag } from './StatusTag'

// Todos los cálculos del informe se leen con la misma forma: pregunta, cifra,
// frase en simple, definición, operación con sus fuentes y relaciones.
export function CalcBlock({
  number,
  total,
  calc,
  usedBy,
  byId,
  children,
}: {
  number: number
  total: number
  calc: Calc
  usedBy: Calc[]
  byId: Map<string, Calc>
  children?: ReactNode
}) {
  const sources = calc.dependsOn.map((id) => byId.get(id)).filter((item) => item !== undefined)

  return (
    <article data-calc={calc.id} className="calc">
      <header className="calc-head">
        <div className="calc-kicker">
          <span>
            Cálculo {number} de {total}
          </span>
          <StatusTag status={calc.status} />
        </div>
        <h3>{calc.question}</h3>
        <div className="calc-name">{calc.name}</div>
      </header>

      <div className="calc-answer">
        <div className="calc-value">{calc.display}</div>
        <p className="calc-plain">{calc.plain}</p>
      </div>

      <div className="calc-block">
        <h4>Qué es</h4>
        <p>{calc.definition}</p>
      </div>

      {calc.equation && (
        <div className="calc-block">
          <h4>Cómo se calcula</h4>
          <Equation equation={calc.equation} name={calc.name} />
        </div>
      )}

      {calc.check && <p className="calc-check">{calc.check}</p>}

      {calc.statusNote && (
        <p className="calc-note">
          <strong>{calc.status === 'por_determinar' ? 'Qué falta determinar' : 'Qué falta confirmar'}:</strong>{' '}
          {calc.statusNote}
        </p>
      )}

      {children}

      {(sources.length > 0 || usedBy.length > 0) && (
        <footer className="calc-links">
          {sources.length > 0 && (
            <div>
              <span className="calc-links-label">Viene de</span>
              {sources.map((item) => (
                <a key={item.id} href={`#calc-${item.id}`}>
                  {item.name}
                </a>
              ))}
            </div>
          )}
          {usedBy.length > 0 && (
            <div>
              <span className="calc-links-label">Se usa en</span>
              {usedBy.map((item) => (
                <a key={item.id} href={`#calc-${item.id}`}>
                  {item.name}
                </a>
              ))}
            </div>
          )}
        </footer>
      )}
    </article>
  )
}
