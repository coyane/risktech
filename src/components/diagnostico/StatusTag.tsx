import { statusLabel, type CalcStatus } from '../../lib/calculos'

const paths: Record<CalcStatus, string> = {
  calculado: 'M8.5 12.5l2.5 2.5 4.5-5',
  por_confirmar: 'M12 7.5v5l3 2',
  por_determinar: 'M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8m0 2.5h.01',
}

// Estado de un cálculo. Lleva ícono y texto: nunca depende solo del color.
export function StatusTag({ status }: { status: CalcStatus }) {
  return (
    <span className={`status status-${status}`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray={status === 'por_determinar' ? '3 3' : undefined}
        />
        <path
          d={paths[status]}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {statusLabel[status]}
    </span>
  )
}
