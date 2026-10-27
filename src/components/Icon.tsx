// Íconos de una sola familia: trazo de 1,5 en una grilla de 16. Siempre decorativos:
// el texto que acompaña al ícono (o su aria-label) es el que da el nombre.
const PATHS = {
  resumen:
    '<rect x="2.5" y="2.5" width="4.5" height="5" rx="1.2"/><rect x="9" y="2.5" width="4.5" height="3" rx="1.2"/><rect x="2.5" y="9.5" width="4.5" height="4" rx="1.2"/><rect x="9" y="7.5" width="4.5" height="6" rx="1.2"/>',
  calculos: '<path d="M12 3H4l4.5 5L4 13h8"/>',
  credito:
    '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v6M6.2 6.6c0-.9.8-1.4 1.8-1.4s1.8.5 1.8 1.3c0 1.9-3.6 1-3.6 2.9 0 .8.8 1.4 1.8 1.4s1.8-.5 1.8-1.4"/>',
  propiedades: '<path d="M3 13.5V3.5h6v10M9 6.5h4v7M2 13.5h12M5 6h2M5 8.5h2M5 11h2"/>',
  datos: '<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M6 8h4M6 10.5h4"/>',
  pendientes: '<circle cx="8" cy="8" r="5.6"/><path d="M8 5v3.2l2 1.3"/>',
  glosario:
    '<path d="M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 0 7 12H3zM13 3.5H9.5A1.5 1.5 0 0 0 8 5v8.5A1.5 1.5 0 0 1 9.5 12H13z"/>',
  deudas: '<path d="M4 2.5h8v11l-2-1.2-2 1.2-2-1.2-2 1.2z"/><path d="M6.2 5.5h3.6M6.2 8h3.6M6.2 10.5h2"/>',
  upload: '<path d="M8 10.5v-8M5 5.5l3-3 3 3M3 11.5v1.5h10v-1.5"/>',
  copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.8c0-.7-.6-1.3-1.3-1.3H3.8c-.7 0-1.3.6-1.3 1.3v5.4c0 .7.6 1.3 1.3 1.3h1.7"/>',
  check: '<path d="M3.5 8.5l3 3 6-7"/>',
  external: '<path d="M9.5 2.5h4v4M13.5 2.5L8 8M11.5 9.5v3c0 .6-.4 1-1 1h-7c-.6 0-1-.4-1-1v-7c0-.6.4-1 1-1h3"/>',
  lock: '<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
  alert: '<circle cx="8" cy="8" r="5.6"/><path d="M8 5v3.5M8 10.8v.1"/>',
  file: '<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M9.5 2.5V5H12"/>',
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  chevron: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  back: '<path d="M10 3.5L5.5 8 10 12.5"/>',
  close: '<path d="M4 4l8 8M12 4l-8 8"/>',
  download: '<path d="M8 2.5v7M5 6.8L8 9.8l3-3M3 11.5v1.5h10v-1.5"/>',
  more: '<circle cx="4" cy="8" r=".9" fill="currentColor"/><circle cx="8" cy="8" r=".9" fill="currentColor"/><circle cx="12" cy="8" r=".9" fill="currentColor"/>',
  spark: '<path d="M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3M4.2 4.2l2 2M9.8 9.8l2 2M11.8 4.2l-2 2M6.2 9.8l-2 2"/>',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
