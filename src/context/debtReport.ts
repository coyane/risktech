import { createContext, useContext } from 'react'
import type { StepState } from '../types'
import type { DebtCheckStepKey, DebtRejection } from '../lib/verificacionDeudas'

export interface DebtPage {
  src: string
  width: number
  height: number
}

// Un informe que pasó la verificación con su código QR. Solo así entra a la carpeta.
export interface DebtFile {
  name: string
  size: number
  loadedAt: Date
  pages: DebtPage[]
  verifiedAt: Date
  simulated: boolean
}

// Lo que pasa con el último archivo elegido.
export type DebtPhase =
  | { kind: 'idle' }
  | {
      kind: 'checking'
      name: string
      steps: { key: DebtCheckStepKey; state: StepState }[]
      simulated: boolean
    }
  // Rechazado por el documento: no se guarda.
  | { kind: 'rejected'; name: string; reason: DebtRejection }
  // El servicio no respondió: se puede reintentar con el mismo archivo.
  | { kind: 'service'; name: string }

export interface DebtReportValue {
  // El informe verificado. Vive en memoria mientras dure la sesión; no se guarda en el navegador.
  file: DebtFile | null
  phase: DebtPhase
  // Error del archivo antes de verificarlo (no es PDF, pesa demasiado, no se puede leer).
  error: string | null
  // Aviso para lectores de pantalla al terminar, cancelar o quitar.
  notice: string
  load: (files: FileList | File[]) => void
  cancel: () => void
  retry: () => void
  dismiss: () => void
  remove: () => void
}

export const DebtReportContext = createContext<DebtReportValue | null>(null)

export function useDebtReport() {
  const ctx = useContext(DebtReportContext)
  if (!ctx) throw new Error('useDebtReport debe usarse dentro de DebtReportProvider')
  return ctx
}
