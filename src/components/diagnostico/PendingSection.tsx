import type { PendingItem } from '../../lib/calculos'
import { DataChip } from './Equation'
import { StatusTag } from './StatusTag'

// Sección cuya fórmula o datos aún no se conocen. Se muestra igual, con lo que se tiene.
export function PendingSection({ item }: { item: PendingItem }) {
  return (
    <article data-calc={item.id} className="calc calc-pending">
      <header className="calc-head">
        <div className="calc-kicker">
          <StatusTag status="por_determinar" />
        </div>
        <h3>{item.name}</h3>
      </header>
      <div className="calc-block">
        <h4>Qué es</h4>
        <p>{item.definition}</p>
      </div>
      <div className="calc-block">
        <h4>Datos que ya se tienen</h4>
        {item.inputs.length === 0 ? (
          <p>Ninguno.</p>
        ) : (
          <div className="eq">
            {item.inputs.map((operand) => (
              <span className="eq-term" key={operand.label}>
                <DataChip operand={operand} />
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="calc-note">
        <strong>Qué falta determinar:</strong> {item.missing}
      </p>
    </article>
  )
}
