import { kindLabel, type Equation as EquationData, type Operand } from '../../lib/calculos'

function hrefOf(operand: Operand) {
  if (operand.kind === 'calc' && operand.calcId) return `#calc-${operand.calcId}`
  if (operand.kind === 'sii' && operand.table) {
    return operand.row ? `#${operand.table}-${operand.row}` : `#${operand.table}`
  }
  return undefined
}

// Ficha de un dato: qué es, cuánto vale, de qué tipo es y de dónde viene.
export function DataChip({ operand }: { operand: Operand }) {
  const href = hrefOf(operand)
  const body = (
    <>
      <span className="chip-kind">{kindLabel[operand.kind]}</span>
      <span className="chip-label">{operand.label}</span>
      <span className="chip-value">{operand.display}</span>
      <span className="chip-source">{operand.source}</span>
    </>
  )
  return href ? (
    <a className={`data-chip kind-${operand.kind}`} href={href}>
      {body}
    </a>
  ) : (
    <span className={`data-chip kind-${operand.kind}`}>{body}</span>
  )
}

function ResultChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="data-chip kind-result">
      <span className="chip-kind">Resultado</span>
      <span className="chip-label">{label}</span>
      <span className="chip-value">{value}</span>
    </span>
  )
}

const opWord: Record<string, string> = {
  '+': 'más',
  '−': 'menos',
  '×': 'multiplicado por',
  '÷': 'dividido por',
  '=': 'es igual a',
}

function OpSign({ op }: { op: string }) {
  return (
    <span className="eq-op">
      <span aria-hidden="true">{op}</span>
      <span className="sr-only">{opWord[op]}</span>
    </span>
  )
}

// La operación dibujada con fichas, de izquierda a derecha.
export function Equation({ equation, name }: { equation: EquationData; name: string }) {
  switch (equation.kind) {
    case 'arith':
      return (
        <div className="eq">
          {equation.terms.length === 0 && (
            <span className="eq-note">Todos los conceptos de esta suma están en cero.</span>
          )}
          {equation.terms.map((term, index) => (
            <span className="eq-term" key={`${term.operand.label}-${index}`}>
              {term.op && <OpSign op={term.op} />}
              <DataChip operand={term.operand} />
            </span>
          ))}
          <span className="eq-term">
            <OpSign op="=" />
            <ResultChip label={name} value={equation.result} />
          </span>
          {equation.terms.length > 0 && equation.zeros > 0 && (
            <span className="eq-note">
              {equation.zeros} {equation.zeros === 1 ? 'concepto en cero no se muestra' : 'conceptos en cero no se muestran'}.
            </span>
          )}
        </div>
      )
    case 'formula':
      return (
        <div className="eq eq-formula">
          <div className="eq-formula-text">
            <span className="chip-kind">Fórmula</span>
            {equation.formula}
          </div>
          <div className="eq">
            {equation.operands.map((operand) => (
              <span className="eq-term" key={operand.label}>
                <DataChip operand={operand} />
              </span>
            ))}
            <span className="eq-term">
              <OpSign op="=" />
              <ResultChip label={name} value={equation.result} />
            </span>
          </div>
        </div>
      )
    case 'ranges':
      return (
        <div className="eq eq-ranges">
          <DataChip operand={equation.input} />
          <ul className="brackets">
            {equation.ranges.map((item) => (
              <li key={item.label} className={item.current ? 'current' : undefined}>
                <span className="bracket-name">{item.label}</span>
                <span className="mono bracket-range">{item.range}</span>
                {item.current && <span className="tag tag-neutral">Corresponde</span>}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'parts':
      return (
        <div className="eq eq-ranges">
          <ul className="brackets brackets-parts">
            {equation.rows.map((row) => (
              <li key={row.operand.label}>
                <span className="bracket-name">
                  {row.operand.label}
                  <span className="bracket-note">
                    {row.operand.source} · {row.note}
                  </span>
                </span>
                <span className="mono bracket-range">{row.operand.display}</span>
              </li>
            ))}
            <li className="current">
              <span className="bracket-name">{name}</span>
              <span className="mono bracket-range">{equation.total}</span>
            </li>
          </ul>
        </div>
      )
    case 'multiples':
      return (
        <div className="eq eq-ranges">
          <DataChip operand={equation.base} />
          <ul className="brackets">
            {equation.rows.map((row) => (
              <li key={row.label}>
                <span className="bracket-name">{row.label}</span>
                <span className="mono bracket-range">{row.result}</span>
              </li>
            ))}
          </ul>
        </div>
      )
  }
}
