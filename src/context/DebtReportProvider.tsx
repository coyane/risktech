import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { checkDebtFile, DEBT_TEXT, MAX_PAGES } from '../lib/informeDeudas'
import type { PdfPageImage } from '../lib/pdfPages'
import {
  cancelDebtVerification,
  DEBT_CHECK_SIMULATED,
  DEBT_CHECK_STEPS,
  getDebtVerification,
  isFinal,
  isRejection,
  verifyDebtReport,
  type DebtCheck,
} from '../lib/verificacionDeudas'
import { DebtReportContext, type DebtFile, type DebtPhase, type DebtReportValue } from './debtReport'
import { useRun } from './run'

const POLL_MS = 400
const IDLE: DebtPhase = { kind: 'idle' }

const revokeAll = (pages: PdfPageImage[] | null | undefined) => pages?.forEach((page) => URL.revokeObjectURL(page.src))
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))
const firstSteps = () =>
  DEBT_CHECK_STEPS.map((key, index) => ({ key, state: index === 0 ? ('running' as const) : ('queued' as const) }))

// Informe de deudas de la CMF que carga la persona. Se verifica con su código QR (servicio del
// backend; simulado en la demo) mientras sus páginas se dibujan en este navegador. Solo un
// documento verificado se guarda, en memoria: se mantiene al cambiar de vista y se pierde al
// recargar. Un rechazo lo descarta. Una captura nueva (o cerrar sesión) lo quita.
export function DebtReportProvider({ children }: { children: ReactNode }) {
  const { runId } = useRun()
  const [file, setFile] = useState<DebtFile | null>(null)
  const [phase, setPhase] = useState<DebtPhase>(IDLE)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [owner, setOwner] = useState(runId)
  // Cada intento lleva un número: si la persona cancela o elige otro archivo, el resultado
  // anterior se descarta.
  const attempt = useRef(0)
  const job = useRef<string | null>(null)
  // El archivo del último intento, solo para "Reintentar" tras un error del servicio.
  const pending = useRef<File | null>(null)
  const current = useRef<DebtFile | null>(null)

  if (owner !== runId) {
    setOwner(runId)
    setFile(null)
    setPhase(IDLE)
    setError(null)
    setNotice('')
  }

  useEffect(() => {
    if (current.current !== file) revokeAll(current.current?.pages)
    current.current = file
  }, [file])

  useEffect(() => () => revokeAll(current.current?.pages), [])

  const stopJob = () => {
    if (job.current) void cancelDebtVerification(job.current)
    job.current = null
  }

  const verify = useCallback((picked: File, token: number) => {
    pending.current = picked
    setError(null)
    setPhase({ kind: 'checking', name: picked.name, steps: firstSteps(), simulated: DEBT_CHECK_SIMULATED })
    const stale = () => token !== attempt.current

    // Las páginas se dibujan mientras se verifica; solo se muestran si el documento es válido.
    const pages = (async () => {
      const [{ renderPdfPages }, data] = await Promise.all([import('../lib/pdfPages'), picked.arrayBuffer()])
      return renderPdfPages(data, MAX_PAGES, () => {})
    })().then(
      (images) => {
        if (stale()) revokeAll(images)
        return stale() ? null : images
      },
      (reason: unknown) => {
        // Un PDF que no se puede leer no sigue a la verificación.
        if (!stale()) {
          attempt.current += 1
          stopJob()
          pending.current = null
          const kind = (reason as { reason?: string }).reason
          setPhase(IDLE)
          setError(
            kind === 'password'
              ? DEBT_TEXT.errors.password
              : kind === 'tooManyPages'
                ? DEBT_TEXT.errors.tooManyPages
                : DEBT_TEXT.errors.unreadable,
          )
        }
        return null
      },
    )
    const discard = () => void pages.then(revokeAll)

    void (async () => {
      let check: DebtCheck
      try {
        const { id } = await verifyDebtReport(picked)
        if (stale()) return void cancelDebtVerification(id)
        job.current = id
        do {
          await wait(POLL_MS)
          if (stale()) return
          check = await getDebtVerification(id)
          if (stale()) return
          setPhase({ kind: 'checking', name: picked.name, steps: check.steps, simulated: check.simulated })
        } while (!isFinal(check.status))
      } catch {
        if (stale()) return
        check = { id: '', status: 'SERVICE_ERROR', steps: [], verifiedAt: null, simulated: DEBT_CHECK_SIMULATED, correlationId: '' }
      }
      job.current = null

      if (check.status === 'VERIFIED') {
        const images = await pages
        if (stale() || !images) return
        pending.current = null
        setFile({
          name: picked.name,
          size: picked.size,
          loadedAt: new Date(),
          pages: images,
          verifiedAt: check.verifiedAt ? new Date(check.verifiedAt) : new Date(),
          simulated: check.simulated,
        })
        setPhase(IDLE)
        setNotice(DEBT_TEXT.verifiedStatus(images.length))
        return
      }
      discard()
      if (isRejection(check.status)) {
        // El documento se descarta: no queda en memoria ni en la carpeta.
        pending.current = null
        setPhase({ kind: 'rejected', name: picked.name, reason: check.status })
        setNotice(DEBT_TEXT.rejectedStatus(DEBT_TEXT.rejected[check.status]))
      } else if (check.status === 'SERVICE_ERROR') {
        setPhase({ kind: 'service', name: picked.name })
        setNotice(DEBT_TEXT.serviceTitle)
      } else {
        pending.current = null
        setPhase(IDLE)
      }
    })()
  }, [])

  const load = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      const token = ++attempt.current
      stopJob()
      pending.current = null
      if (list.length !== 1) {
        setPhase(IDLE)
        setError(list.length === 0 ? DEBT_TEXT.errors.notPdf : DEBT_TEXT.errors.several)
        return
      }
      const [picked] = list
      void checkDebtFile(picked).then((problem) => {
        if (token !== attempt.current) return
        if (problem) {
          setPhase(IDLE)
          setError(problem)
          return
        }
        verify(picked, token)
      })
    },
    [verify],
  )

  const cancel = useCallback(() => {
    attempt.current += 1
    stopJob()
    pending.current = null
    setPhase(IDLE)
    setNotice(DEBT_TEXT.cancelledStatus)
  }, [])

  const retry = useCallback(() => {
    const picked = pending.current
    if (picked) verify(picked, ++attempt.current)
  }, [verify])

  const dismiss = useCallback(() => {
    attempt.current += 1
    stopJob()
    pending.current = null
    setPhase(IDLE)
  }, [])

  const remove = useCallback(() => {
    attempt.current += 1
    stopJob()
    pending.current = null
    setFile(null)
    setPhase(IDLE)
    setError(null)
    setNotice(DEBT_TEXT.removedStatus)
  }, [])

  const value = useMemo<DebtReportValue>(
    () => ({ file, phase, error, notice, load, cancel, retry, dismiss, remove }),
    [file, phase, error, notice, load, cancel, retry, dismiss, remove],
  )

  return <DebtReportContext.Provider value={value}>{children}</DebtReportContext.Provider>
}
