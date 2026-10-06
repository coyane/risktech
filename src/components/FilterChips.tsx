export function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="chip-group" role="group" aria-label={label}>
      {options.map((item) => (
        <button
          key={item}
          type="button"
          className={`chip${item === value ? ' on' : ''}`}
          aria-pressed={item === value}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
