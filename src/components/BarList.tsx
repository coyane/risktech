export interface BarItem {
  key: string
  label: string
  value: number
  detail: string
  color: string
}

export function BarList({ items, label }: { items: BarItem[]; label: string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="bar-list" aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <div className="bar-list-head">
            <span>{item.label}</span>
            <span className="mono muted">{item.detail}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
