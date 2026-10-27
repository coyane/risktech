import { forwardRef, type ReactNode } from 'react'
import { formatDecimal } from '../../lib/format'
import { kindLabel, statusLabel, type CalcStatus, type Equation, type Operand } from '../../lib/calculos'
import type { CalcGroupId } from '../../lib/reportViews'
import { StatusTag } from '../diagnostico/StatusTag'
import { Icon } from '../Icon'
import { BigValue, KindGlyph } from './Bits'

// Un cálculo listo para leerse por niveles. Sale del registro (cálculo o pendiente) o es
// una sección propia, como Contingencias.
export interface LevelEntry {
  key: string
  name: string
  question: string
  display: string
  status: CalcStatus | null
  plain: string | null
  statusNote: string | null
  definition: string | null
  check: string | null
  equation: Equation | null
  inputs: Operand[] | null
  node?: ReactNode
  from: { id: string; name: string }[]
  used: { id: string; name: string }[]
}

export interface LevelGroup {
  id: CalcGroupId
  title: string
  entries: LevelEntry[]
}

export type LevelKey = 'operacion' | 'origen'

const OP_WORD: Record<string, string> = { '+': 'más', '−': 'menos', '×': 'por', '÷': 'dividido por' }

function hrefOf(operand: Operand) {
  if (operand.kind === 'calc' && operand.calcId) return `#calc-${operand.calcId}`
  if (operand.kind === 'sii' && operand.table) return operand.row ? `#${operand.table}-${operand.row}` : `#${operand.table}`
  return undefined
}

function OperandRow({ op, operand }: { op: string | null; operand: Operand }) {
  const href = hrefOf(operand)
  return (
    <li>
      <span className="pn-op-sign" aria-hidden="true">
        {op ?? ''}
      </span>
      <KindGlyph kind={operand.kind} />
      <span className="pn-op-label">
        <span className="sr-only">
          {kindLabel[operand.kind]}
          {op ? `, ${OP_WORD[op]}` : ''}:{' '}
        </span>
        {href ? <a href={href}>{operand.label}</a> : operand.label}
      </span>
      <span className="pn-op-value">{operand.display}</span>
    </li>
  )
}

function ResultRow({ name, value }: { name: string; value: string }) {
  return (
    <li className="pn-op-result">
      <span className="pn-op-sign" aria-hidden="true">
        =
      </span>
      <KindGlyph kind="calc" />
      <span className="pn-op-label">
        <span className="sr-only">Es igual a: </span>
        {name}
      </span>
      <span className="pn-op-value">{value}</span>
    </li>
  )
}

// La operación como una lista de arriba abajo: operador, tipo de dato, nombre y valor.
export function OperationList({ entry }: { entry: LevelEntry }) {
  const { equation, inputs } = entry
  const legend = (
    <p className="pn-op-legend">
      {(['sii', 'param', 'calc'] as const).map((kind) => (
        <span key={kind}>
          <KindGlyph kind={kind} />
          {kindLabel[kind]}
        </span>
      ))}
    </p>
  )
  if (inputs) {
    return (
      <>
        {legend}
        {inputs.length === 0 ? (
          <p className="pn-def">Aún no hay datos para este cálculo.</p>
        ) : (
          <ol className="pn-op">
            {inputs.map((operand) => (
              <OperandRow key={operand.label} op={null} operand={operand} />
            ))}
          </ol>
        )}
      </>
    )
  }
  if (!equation) return <p className="pn-def">Sin operación para este año.</p>
  switch (equation.kind) {
    case 'arith':
      return (
        <>
          {legend}
          <ol className="pn-op">
            {equation.terms.map((term, index) => (
              <OperandRow key={index} op={term.op} operand={term.operand} />
            ))}
            <ResultRow name={entry.name} value={equation.result} />
          </ol>
          {equation.omitted && equation.omitted.length > 0 && (
            <p className="pn-note">En cero y sin dibujar: {equation.omitted.join(', ')}.</p>
          )}
        </>
      )
    case 'formula':
      return (
        <>
          {legend}
          <p className="pn-formula">{equation.formula}</p>
          <ol className="pn-op">
            {equation.operands.map((operand) => (
              <OperandRow key={operand.label} op={null} operand={operand} />
            ))}
            <ResultRow name={entry.name} value={equation.result} />
          </ol>
        </>
      )
    case 'ranges':
      return (
        <>
          {legend}
          <ol className="pn-op">
            <OperandRow op={null} operand={equation.input} />
            {equation.ranges.map((range) => (
              <li key={range.label} className={range.current ? 'pn-op-current' : undefined}>
                <span className="pn-op-sign" aria-hidden="true">
                  {range.current ? '→' : ''}
                </span>
                <span />
                <span className="pn-op-label">
                  {range.label}
                  <span className="pn-op-sub">{range.range}</span>
                </span>
                <span className="pn-op-value pn-op-small">{range.current ? 'Tramo de esta base' : ''}</span>
              </li>
            ))}
          </ol>
        </>
      )
    case 'multiples':
      return (
        <>
          {legend}
          <ol className="pn-op">
            <OperandRow op={null} operand={equation.base} />
            {equation.rows.map((row) => (
              <li key={row.label}>
                <span className="pn-op-sign" aria-hidden="true">
                  ×
                </span>
                <span />
                <span className="pn-op-label">{row.label}</span>
                <span className="pn-op-value">{row.result}</span>
              </li>
            ))}
          </ol>
        </>
      )
    case 'parts':
      return (
        <>
          {legend}
          <ol className="pn-op">
            {equation.rows.map((row, index) => (
              <OperandRow key={row.operand.label} op={index === 0 ? null : '+'} operand={row.operand} />
            ))}
            <ResultRow name={entry.name} value={equation.total} />
          </ol>
        </>
      )
  }
}

function operandsOf(entry: LevelEntry): Operand[] {
  if (entry.inputs) return entry.inputs
  const equation = entry.equation
  if (!equation) return []
  switch (equation.kind) {
    case 'arith':
      return equation.terms.map((term) => term.operand)
    case 'formula':
      return equation.operands
    case 'parts':
      return equation.rows.map((row) => ({ ...row.operand, source: `${row.operand.source} · ${row.note}` }))
    case 'ranges':
      return [equation.input]
    case 'multiples':
      return [equation.base]
  }
}

// Definición, fuentes de cada dato y relaciones con otros cálculos.
function OriginBody({ entry }: { entry: LevelEntry }) {
  const sources = operandsOf(entry)
  return (
    <>
      {entry.definition && <p className="pn-def">{entry.definition}</p>}
      {entry.check && <p className="pn-callout is-confirm">{entry.check}</p>}
      {sources.length > 0 && (
        <>
          <h4 className="pn-sub">Fuentes</h4>
          <ul className="pn-sources">
            {sources.map((operand) => (
              <li key={operand.label}>
                <KindGlyph kind={operand.kind} />
                <span>{operand.label}</span>
                <span className="pn-source">
                  {kindLabel[operand.kind]} · {operand.source}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {entry.from.length > 0 && (
        <>
          <h4 className="pn-sub">Viene de</h4>
          <p className="pn-rel">
            {entry.from.map((item) => (
              <a key={item.id} href={`#calc-${item.id}`}>
                {item.name}
              </a>
            ))}
          </p>
        </>
      )}
      {entry.used.length > 0 && (
        <>
          <h4 className="pn-sub">Se usa en</h4>
          <p className="pn-rel">
            {entry.used.map((item) => (
              <a key={item.id} href={`#calc-${item.id}`}>
                {item.name}
              </a>
            ))}
          </p>
        </>
      )}
      <p className="pn-note">{entry.name}</p>
    </>
  )
}

function countOperands(entry: LevelEntry) {
  const total = operandsOf(entry).length
  return total === 0 ? '' : `${total} ${total === 1 ? 'dato' : 'datos'}`
}

function Level({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  hint: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="pn-level" data-open={open || undefined}>
      <button type="button" className="pn-level-btn" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <Icon name="chevron" />
        {title}
        <small>{hint}</small>
      </button>
      <div className="pn-level-body" id={id} inert={!open}>
        <div>
          <div className="pn-level-in">{children}</div>
        </div>
      </div>
    </div>
  )
}

// Nivel 1: la respuesta. Niveles 2 y 3, plegados: la operación, y qué es y de dónde sale.
// En el PDF (print) los niveles salen abiertos y sin botones.
export function CalcDetail({
  entry,
  group,
  position,
  prev,
  next,
  open,
  onToggle,
  closeHref,
  print = false,
}: {
  entry: LevelEntry
  group: LevelGroup
  position: number
  prev?: string
  next?: string
  open?: Record<LevelKey, boolean>
  onToggle?: (key: LevelKey) => void
  closeHref?: string
  print?: boolean
}) {
  const head = (
    <div className="pn-detail-top">
      <span className="pn-detail-pos">
        {group.title} · {position} de {group.entries.length}
      </span>
      <span className="pn-detail-tools">
        {entry.status && <StatusTag status={entry.status} />}
        {!print && (
          <>
            {prev ? (
              <a className="pn-round" href={`#calc-${prev}`} aria-label="Cálculo anterior">
                <Icon name="back" />
              </a>
            ) : (
              <span className="pn-round is-off" aria-hidden="true" />
            )}
            {next ? (
              <a className="pn-round" href={`#calc-${next}`} aria-label="Cálculo siguiente">
                <Icon name="chevron" />
              </a>
            ) : (
              <span className="pn-round is-off" aria-hidden="true" />
            )}
            {closeHref && (
              <a className="pn-round pn-close" href={closeHref} aria-label="Cerrar el cálculo">
                <Icon name="close" />
              </a>
            )}
          </>
        )}
      </span>
    </div>
  )

  if (entry.node) {
    return (
      <article className="pn-detail" data-calc={entry.key}>
        {head}
        <h3 className="pn-detail-q">{entry.question}</h3>
        {entry.node}
      </article>
    )
  }

  const pendingValue = entry.display === '—' && entry.status === 'por_determinar'
  return (
    <article className="pn-detail" data-calc={entry.key}>
      {head}
      <h3 className="pn-detail-q">{entry.question}</h3>
      <div className="pn-detail-value">
        {pendingValue ? <span className="pn-pending-value">{statusLabel.por_determinar}</span> : <BigValue display={entry.display} />}
      </div>
      {entry.plain && <p className="pn-plain">{entry.plain}</p>}
      {entry.statusNote && (
        <p className={`pn-callout ${entry.status === 'por_determinar' ? 'is-det' : 'is-confirm'}`}>
          <strong>{entry.status === 'por_determinar' ? 'Qué falta determinar: ' : 'Qué falta confirmar: '}</strong>
          {entry.statusNote}
        </p>
      )}
      {print ? (
        <div className="pn-levels">
          <h4 className="pn-sub">La operación</h4>
          <OperationList entry={entry} />
          <h4 className="pn-sub">Qué es y de dónde sale</h4>
          <OriginBody entry={entry} />
        </div>
      ) : (
        <div className="pn-levels">
          <Level
            id={`nivel-operacion-${entry.key}`}
            title="La operación"
            hint={countOperands(entry)}
            open={open?.operacion ?? false}
            onToggle={() => onToggle?.('operacion')}
          >
            <OperationList entry={entry} />
          </Level>
          <Level
            id={`nivel-origen-${entry.key}`}
            title="Qué es y de dónde sale"
            hint="Definición y fuentes"
            open={open?.origen ?? false}
            onToggle={() => onToggle?.('origen')}
          >
            <OriginBody entry={entry} />
          </Level>
        </div>
      )}
    </article>
  )
}

// La vista Cálculos en pantalla: grupos, índice del grupo y el cálculo abierto al lado.
// Bajo 1180 px el cálculo se abre como hoja sobre el índice.
export const CalcLevels = forwardRef<
  HTMLDivElement,
  {
    groups: LevelGroup[]
    group: LevelGroup
    entry: LevelEntry
    // Hay un cálculo pedido por la dirección (en pantallas angostas abre la hoja).
    chosen: boolean
    open: Record<LevelKey, boolean>
    onToggle: (key: LevelKey) => void
  }
>(function CalcLevels({ groups, group, entry, chosen, open, onToggle }, ref) {
  const index = group.entries.findIndex((item) => item.key === entry.key)
  const statusClass = (status: CalcStatus | null) =>
    status === 'por_confirmar' ? 'is-confirm' : status === 'por_determinar' ? 'is-det' : 'is-ok'

  return (
    <div className="pn-calcs no-print">
      <nav className="pn-seg pn-groups" aria-label="Grupos de cálculos">
        {groups.map((item) => (
          <a key={item.id} href={`#grupo-${item.id}`} aria-current={item.id === group.id ? 'true' : undefined}>
            {item.title}
          </a>
        ))}
      </nav>
      <div className="pn-calc-grid">
        <nav className="pn-index" aria-label={`Cálculos de ${group.title}`}>
          {group.entries.map((item) => (
            <a
              key={item.key}
              className={`pn-idx ${statusClass(item.status)}`}
              href={`#calc-${item.key}`}
              aria-current={item.key === entry.key ? 'true' : undefined}
            >
              {item.status ? <StatusIcon status={item.status} /> : <span />}
              <span className="pn-idx-name">{item.name}</span>
              {item.status && <span className="pn-idx-status">{statusLabel[item.status]}</span>}
              <span className="pn-idx-value">{item.status ? compact(item.display) : ''}</span>
            </a>
          ))}
        </nav>
        <a className={`pn-scrim${chosen ? ' is-open' : ''}`} href={`#grupo-${group.id}`} aria-hidden="true" tabIndex={-1} />
        <div ref={ref} className={`pn-panel${chosen ? ' is-open' : ''}`} tabIndex={-1} aria-live="polite">
          <CalcDetail
            entry={entry}
            group={group}
            position={index + 1}
            prev={group.entries[index - 1]?.key}
            next={group.entries[index + 1]?.key}
            open={open}
            onToggle={onToggle}
            closeHref={`#grupo-${group.id}`}
          />
        </div>
      </div>
    </div>
  )
})

function StatusIcon({ status }: { status: CalcStatus }) {
  return (
    <svg className="pn-idx-icon" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {status === 'calculado' && <path d="M4 8.5l2.6 2.6L12 5.6" />}
      {status === 'por_confirmar' && (
        <>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M8 5v3.2l2 1.3" />
        </>
      )}
      {status === 'por_determinar' && <circle cx="8" cy="8" r="5.6" strokeDasharray="2.2 2" />}
    </svg>
  )
}

// En el índice, los montos grandes van abreviados en millones ($104,8 MM).
function compact(display: string) {
  const match = display.match(/^\$([\d.]+)$/)
  if (!match) return display
  const value = Number(match[1].replace(/\./g, ''))
  if (value < 1_000_000) return display
  return `$${formatDecimal(value / 1_000_000, 1)} MM`
}
