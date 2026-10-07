import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { statusLabel, type CalcStatus } from '../../lib/calculos'

export interface ExplorerEntry {
  key: string
  name: string
  value: string
  status: CalcStatus | null
  // Número del cálculo en el informe; los que aún no se pueden calcular no llevan.
  number: number | null
  node: ReactNode
}

export interface ExplorerGroup {
  id: string
  title: string
  // De dónde salen los datos de este grupo.
  source?: { label: string; href: string }
  entries: ExplorerEntry[]
}

const CLOSED = '#calculos'
const WIDE = '(width > 1100px)'
const hrefOf = (key: string) => `#calc-${key}`

function subscribeWide(notify: () => void) {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}

// Los cálculos se ven como bloques y la explicación de uno queda al lado, en la misma sección.
// Con espacio siempre hay una explicación abierta (parte por el primero) y los bloques sirven
// para cambiarla. Sin espacio, la explicación se desliza sobre los bloques al elegir uno.
// En el PDF se imprimen todos, en el orden de los bloques.
export function CalcExplorer({
  groups,
  selected,
  lead,
  children,
}: {
  groups: ExplorerGroup[]
  selected: string | null
  lead: ReactNode
  // Lo que acompaña a los bloques cuando no hay un cálculo abierto: cascada y guía de lectura.
  children: ReactNode
}) {
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches)
  const flat = groups.flatMap((group) => group.entries)
  const asked = flat.findIndex((entry) => entry.key === selected)
  const index = asked === -1 && wide && flat.length > 0 ? 0 : asked
  const open = index !== -1
  const shown = open ? flat[index].key : null
  const previous = index > 0 ? flat[index - 1] : null
  const next = open && index < flat.length - 1 ? flat[index + 1] : null
  const current = groups.find((group) => group.entries.some((entry) => entry.key === shown))
  const detailRef = useRef<HTMLElement>(null)
  const lastKey = useRef<string | null>(null)

  // Cada cálculo se lee desde arriba. Al abrir, el foco pasa a la explicación;
  // al cerrar, vuelve al bloque que se estaba mirando.
  useEffect(() => {
    const before = lastKey.current
    lastKey.current = shown
    if (shown !== null) {
      if (detailRef.current) detailRef.current.scrollTop = 0
      if (before === null && !wide) detailRef.current?.focus({ preventScroll: true })
    } else if (before !== null) {
      document.querySelector<HTMLElement>(`.index-row[href="${hrefOf(before)}"]`)?.focus({ preventScroll: true })
    }
  }, [shown, wide])

  // Escape cierra la explicación solo cuando está deslizada sobre los bloques.
  useEffect(() => {
    if (!open || wide) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.location.hash = CLOSED
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, wide])

  return (
    <div className="explorer-wrap">
      {lead}
      <div className="explorer-extra">{children}</div>
      <div className="explorer">
        <div className="explorer-index">
          <div className="index-grid">
            {groups.map((group) => (
              <section className="index-card" key={group.id} aria-labelledby={`indice-${group.id}`}>
                <header className="index-head">
                  <h3 id={`indice-${group.id}`}>{group.title}</h3>
                  <span className="index-count">
                    {group.entries.length} {group.entries.length === 1 ? 'cálculo' : 'cálculos'}
                  </span>
                </header>
                <ol className="index-list">
                  {group.entries.map((entry) => (
                    <li key={entry.key}>
                      <a
                        className={`index-row${entry.status ? ` status-edge-${entry.status}` : ''}`}
                        href={hrefOf(entry.key)}
                        aria-current={entry.key === shown ? 'true' : undefined}
                      >
                        <span className="index-num">{entry.number ?? '·'}</span>
                        <span className="index-name">{entry.name}</span>
                        <span className="index-status">{entry.status ? statusLabel[entry.status] : ''}</span>
                        <span className="index-value">{entry.value}</span>
                      </a>
                    </li>
                  ))}
                </ol>
                {group.source && (
                  <a className="index-source" href={group.source.href}>
                    Datos de origen: {group.source.label}
                  </a>
                )}
              </section>
            ))}
          </div>
        </div>

        {open && <a className="explorer-backdrop no-print" href={CLOSED} aria-label="Cerrar la explicación" tabIndex={-1} />}

        <section
          className="explorer-detail"
          aria-label="Explicación del cálculo"
          data-open={shown ?? undefined}
          hidden={!open}
          ref={detailRef}
          tabIndex={-1}
        >
          <div className="detail-bar no-print">
            <span className="detail-group">{current?.title}</span>
            <div className="detail-actions">
              {previous && (
                <a className="btn btn-sm" href={hrefOf(previous.key)} title={previous.name}>
                  ← Anterior
                </a>
              )}
              {next && (
                <a className="btn btn-sm" href={hrefOf(next.key)} title={next.name}>
                  Siguiente →
                </a>
              )}
              <a className="btn btn-sm detail-close" href={CLOSED}>
                Cerrar <span aria-hidden="true">✕</span>
              </a>
            </div>
          </div>
          {groups.map((group) => (
            <div className="explorer-section" key={group.id}>
              <p className="explorer-section-title print-block">{group.title}</p>
              {group.entries.map((entry) => (
                <div className="explorer-panel" key={entry.key} hidden={entry.key !== shown}>
                  {entry.node}
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
