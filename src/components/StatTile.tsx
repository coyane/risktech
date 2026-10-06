export function StatTile({
  label,
  value,
  note,
  mono = false,
}: {
  label: string
  value: string
  note?: string
  mono?: boolean
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-label">{label}</div>
      <div className={`stat-tile-value${mono ? ' mono' : ''}`}>{value}</div>
      {note && <div className="stat-tile-note">{note}</div>}
    </div>
  )
}
