import { useEffect, useRef, useState, type DragEvent, type RefObject } from 'react'
import { useDebtReport, type DebtPhase } from '../../context/debtReport'
import { formatDate } from '../../lib/format'
import {
  CMF_FICHA_URL,
  CMF_URL,
  DEBT_TEXT,
  formatBytes,
  formatTime,
  isoDate,
} from '../../lib/informeDeudas'
import { DEBT_CHECK_SIMULATED } from '../../lib/verificacionDeudas'
import { scrollBehavior } from '../../lib/dom'
import { Disclosure } from '../Disclosure'
import { Icon, type IconName } from '../Icon'

const T = DEBT_TEXT
const STEP_ICON: Record<string, IconName | null> = { done: 'check', error: 'alert', running: null, queued: null }

// Informe de deudas de la CMF: cómo sacarlo, la carga con su verificación por código QR y el
// documento tal como se cargó. Sin cálculos ni interpretación. En el PDF del informe sale al
// final, con sus páginas y la línea de verificación, o con una línea fija si no se cargó.
export function DebtReportView() {
  const { file, phase, error, notice, load, cancel, retry, dismiss, remove } = useDebtReport()
  const inputRef = useRef<HTMLInputElement>(null)
  const chooseRef = useRef<HTMLButtonElement>(null)
  const fileHeadRef = useRef<HTMLHeadingElement>(null)
  const phaseHeadRef = useRef<HTMLHeadingElement>(null)
  const last = useRef({ kind: phase.kind, file })
  const busy = phase.kind !== 'idle'

  // El foco sigue al proceso: al verificar, al resultado; al terminar, al archivo; al quitarlo,
  // al botón de carga. Solo si la vista está a la vista: no se roba el foco desde otra vista.
  useEffect(() => {
    const previous = last.current
    last.current = { kind: phase.kind, file }
    let target: HTMLElement | null = null
    if (phase.kind !== 'idle' && phase.kind !== previous.kind) target = phaseHeadRef.current
    else if (file && file !== previous.file) target = fileHeadRef.current
    else if (phase.kind === 'idle' && (previous.kind !== 'idle' || (previous.file && !file))) {
      target = file ? fileHeadRef.current : chooseRef.current
    }
    if (target?.offsetParent) target.focus()
  }, [phase.kind, file])

  const choose = () => inputRef.current?.click()
  const goUpload = () => {
    const target = chooseRef.current ?? phaseHeadRef.current
    if (!target) return
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
    target.focus({ preventScroll: true })
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        aria-label={T.choose}
        hidden
        onChange={(event) => {
          if (event.target.files?.length) load(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="dr-screen no-print">
        {file && !busy ? (
          <>
            <section className="pn-card dr-file" aria-labelledby="dr-file-name">
              <div className="dr-file-main">
                <span className="dr-file-icon" aria-hidden="true">
                  <Icon name="file" size={22} />
                </span>
                <div className="dr-file-text">
                  <p className="dr-seal">
                    <span className="dr-seal-mark">
                      <Icon name="check" size={14} />
                      {T.verifiedSeal}
                    </span>
                    <span className="dr-seal-when">
                      {T.verifiedWhen(formatDate(isoDate(file.verifiedAt)), formatTime(file.verifiedAt))}
                      {file.simulated && <> · {T.simulated}</>}
                    </span>
                  </p>
                  <h3 id="dr-file-name" ref={fileHeadRef} tabIndex={-1} className="dr-file-name" translate="no">
                    {file.name}
                  </h3>
                  <p className="pn-note">
                    {T.meta(
                      file.pages.length,
                      formatBytes(file.size),
                      formatDate(isoDate(file.loadedAt)),
                      formatTime(file.loadedAt),
                    )}
                  </p>
                </div>
              </div>
              <div className="dr-file-actions">
                <button type="button" className="pn-btn" onClick={choose} aria-describedby={error ? 'dr-error' : undefined}>
                  <Icon name="upload" />
                  {T.replace}
                </button>
                <button type="button" className="pn-btn" onClick={remove}>
                  <Icon name="close" />
                  {T.remove}
                </button>
              </div>
              {error && <ErrorLine text={error} />}
              <p className="dr-file-note">{T.asLoaded}</p>
              <Privacy />
            </section>
            <Disclosure label={T.guideUpdateTitle} className="dr-more">
              <GuideBody />
            </Disclosure>
          </>
        ) : (
          <div className="pn-grid dr-grid">
            <section className="pn-card is-white s7 dr-guide" aria-labelledby="dr-guide-title">
              <h3 id="dr-guide-title">{T.guideTitle}</h3>
              <GuideBody onGoUpload={goUpload} />
            </section>
            <section className="pn-card s5 dr-upload" aria-labelledby="dr-upload-title" aria-busy={phase.kind === 'checking'}>
              <h3 id="dr-upload-title">{T.uploadTitle}</h3>
              <p className="pn-plain-sm">{T.why}</p>
              {phase.kind === 'idle' ? (
                <DropZone chooseRef={chooseRef} onChoose={choose} onDrop={load} hasError={error !== null} />
              ) : (
                <PhasePanel
                  phase={phase}
                  headRef={phaseHeadRef}
                  hasFile={file !== null}
                  onCancel={cancel}
                  onRetry={retry}
                  onChoose={choose}
                  onKeep={dismiss}
                />
              )}
              {error && <ErrorLine text={error} />}
              <Privacy />
            </section>
          </div>
        )}
      </div>

      {/* Lo que va en la carpeta: título, origen, verificación y las páginas tal cual. */}
      <div className="print-only dr-print-head">
        <h2 className="pn-title">{T.printTitle}</h2>
        {file ? (
          <>
            <p className="pn-note">{T.printSource(file.name, formatDate(isoDate(file.loadedAt)))}</p>
            <p className="dr-print-verified">
              {T.printVerified(formatDate(isoDate(file.verifiedAt)), formatTime(file.verifiedAt), file.simulated)}
            </p>
          </>
        ) : (
          <p className="pn-note">{T.printNone}</p>
        )}
      </div>
      {file && (
        <ol className={`dr-pages${busy ? ' is-screen-hidden' : ''}`} aria-label={T.pagesLabel}>
          {file.pages.map((page, index) => (
            <li key={page.src} className="dr-page">
              <img src={page.src} width={page.width} height={page.height} alt={T.pageAlt(index + 1, file.pages.length)} />
              <span className="dr-page-num" aria-hidden="true">
                {T.pageCaption(index + 1, file.pages.length)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="sr-only" role="status">
        {notice}
      </p>
    </>
  )
}

// Verificación en curso, rechazo o error del servicio, en el lugar de la zona de carga.
function PhasePanel({
  phase,
  headRef,
  hasFile,
  onCancel,
  onRetry,
  onChoose,
  onKeep,
}: {
  phase: Exclude<DebtPhase, { kind: 'idle' }>
  headRef: RefObject<HTMLHeadingElement | null>
  hasFile: boolean
  onCancel: () => void
  onRetry: () => void
  onChoose: () => void
  onKeep: () => void
}) {
  const demo = DEBT_CHECK_SIMULATED ? <p className="dr-demo">{T.simulated}</p> : null
  const keep = hasFile ? (
    <button type="button" className="pn-linkbtn" onClick={onKeep}>
      {T.keepVerified}
    </button>
  ) : null

  if (phase.kind === 'checking') {
    const running = phase.steps.find((step) => step.state === 'running')
    return (
      <div className="dr-check">
        <div className="dr-check-head">
          <span className="dr-spinner" aria-hidden="true" />
          <div className="dr-check-text">
            <h4 ref={headRef} tabIndex={-1} className="dr-panel-title">
              {T.checkTitle}
            </h4>
            <span className="dr-panel-name" translate="no">
              {phase.name}
            </span>
          </div>
        </div>
        <ol className="dr-check-steps" aria-label={T.checkTitle}>
          {phase.steps.map((step) => {
            const icon = STEP_ICON[step.state]
            return (
              <li key={step.key} className={`is-${step.state}`}>
                <span className="dr-check-dot" aria-hidden="true">
                  {icon && <Icon name={icon} size={13} />}
                </span>
                <span>{T.checkSteps[step.key]}</span>
                <span className="sr-only">: {T.stepState[step.state]}</span>
              </li>
            )
          })}
        </ol>
        <p className="sr-only" role="status">
          {running ? T.checkStatus(T.checkSteps[running.key]) : ''}
        </p>
        {demo}
        {hasFile && <p className="pn-note">{T.checkKeep}</p>}
        <div className="dr-panel-actions">
          <button type="button" className="pn-btn" onClick={onCancel}>
            {T.cancel}
          </button>
        </div>
      </div>
    )
  }

  if (phase.kind === 'rejected') {
    return (
      <div className="dr-result is-rejected">
        <div className="dr-result-head">
          <Icon name="alert" size={20} />
          <h4 ref={headRef} tabIndex={-1} className="dr-panel-title">
            {T.rejectedTitle}
          </h4>
        </div>
        <span className="dr-panel-name" translate="no">
          {phase.name}
        </span>
        <p className="dr-result-reason">{T.rejected[phase.reason]}</p>
        <p>{T.rejectedNext}</p>
        {demo}
        <div className="dr-panel-actions">
          <button type="button" className="pn-btn pn-btn-dark" onClick={onChoose}>
            <Icon name="upload" />
            {T.chooseOther}
          </button>
          <a className="pn-btn" href={CMF_URL} target="_blank" rel="noopener noreferrer">
            {T.open}
            <Icon name="external" />
            <span className="sr-only"> {T.openHint}</span>
          </a>
          {keep}
        </div>
      </div>
    )
  }

  return (
    <div className="dr-result is-service">
      <div className="dr-result-head">
        <Icon name="alert" size={20} />
        <h4 ref={headRef} tabIndex={-1} className="dr-panel-title">
          {T.serviceTitle}
        </h4>
      </div>
      <span className="dr-panel-name" translate="no">
        {phase.name}
      </span>
      <p className="dr-result-reason">{T.service}</p>
      {demo}
      <div className="dr-panel-actions">
        <button type="button" className="pn-btn pn-btn-dark" onClick={onRetry}>
          {T.retry}
        </button>
        <button type="button" className="pn-btn" onClick={onChoose}>
          <Icon name="upload" />
          {T.chooseOther}
        </button>
        {keep}
      </div>
    </div>
  )
}

function GuideBody({ onGoUpload }: { onGoUpload?: () => void }) {
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')

  useEffect(() => {
    if (copy === 'idle') return
    const timer = window.setTimeout(() => setCopy('idle'), 4000)
    return () => window.clearTimeout(timer)
  }, [copy])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CMF_URL)
      setCopy('done')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <div className="dr-guide-body">
      <div className="dr-url">
        <span className="dr-url-label" id="dr-url-label">
          {T.urlLabel}
        </span>
        <a
          className="dr-url-link"
          href={CMF_URL}
          target="_blank"
          rel="noopener noreferrer"
          translate="no"
          aria-describedby="dr-url-label"
        >
          {/* Solo se corta entre estas partes, nunca en el guion de "informe-deudas". */}
          <span>https://</span>
          <wbr />
          <span>conocetudeuda.cmfchile.cl</span>
          <wbr />
          <span>/informe-deudas/</span>
        </a>
        <div className="dr-url-actions">
          <button type="button" className="pn-btn" onClick={onCopy}>
            <Icon name={copy === 'done' ? 'check' : 'copy'} />
            {copy === 'done' ? T.copied : T.copy}
          </button>
          <a className="pn-btn pn-btn-dark" href={CMF_URL} target="_blank" rel="noopener noreferrer">
            {T.open}
            <Icon name="external" />
            <span className="sr-only"> {T.openHint}</span>
          </a>
        </div>
        <p className={`dr-copy-status${copy === 'failed' ? ' is-error' : ''}`} role="status">
          {copy === 'done' ? T.copiedStatus : copy === 'failed' ? T.copyFailed : ''}
        </p>
      </div>

      <ol className="dr-steps">
        {T.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
        <li className="dr-step-last">
          <span>{T.lastStep}</span>
          {onGoUpload && (
            <button type="button" className="pn-linkbtn dr-go-upload" onClick={onGoUpload}>
              {T.goUpload}
            </button>
          )}
        </li>
      </ol>

      <p className="pn-note">{T.outside}</p>

      <dl className="dr-facts">
        {T.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.text}</dd>
          </div>
        ))}
      </dl>

      <p className="pn-note">{T.company}</p>
      <p className="pn-note">
        {T.sourceLabel}{' '}
        <a href={CMF_FICHA_URL} target="_blank" rel="noopener noreferrer" className="dr-source-link">
          {T.sourceLink}
          <span className="sr-only"> {T.openHint}</span>
        </a>
        .
      </p>
    </div>
  )
}

function DropZone({
  chooseRef,
  onChoose,
  onDrop,
  hasError,
}: {
  chooseRef: RefObject<HTMLButtonElement | null>
  onChoose: () => void
  onDrop: (files: File[]) => void
  hasError: boolean
}) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  const isFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files')
  const enter = (event: DragEvent) => {
    if (!isFiles(event)) return
    event.preventDefault()
    depth.current += 1
    setOver(true)
  }
  const leave = () => {
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setOver(false)
  }
  const drop = (event: DragEvent) => {
    event.preventDefault()
    depth.current = 0
    setOver(false)
    onDrop(Array.from(event.dataTransfer.files))
  }

  return (
    <div
      className={`dr-drop${over ? ' is-over' : ''}${hasError ? ' is-error' : ''}`}
      onDragEnter={enter}
      onDragOver={(event) => {
        if (isFiles(event)) event.preventDefault()
      }}
      onDragLeave={leave}
      onDrop={drop}
    >
      <Icon name="upload" size={26} className="dr-drop-icon" />
      <p className="dr-drop-title">{over ? T.dropActive : T.drop}</p>
      <span className="dr-drop-or">{T.or}</span>
      <button
        ref={chooseRef}
        type="button"
        className="pn-btn pn-btn-dark"
        onClick={onChoose}
        aria-describedby={hasError ? 'dr-hint dr-error' : 'dr-hint'}
      >
        {T.choose}
      </button>
      <p id="dr-hint" className="pn-note">
        {T.hint}
      </p>
    </div>
  )
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p id="dr-error" className="dr-error" role="alert">
      <Icon name="alert" />
      <span>{text}</span>
    </p>
  )
}

function Privacy() {
  return (
    <p className="dr-privacy">
      <Icon name="lock" size={16} />
      <span>{T.privacy}</span>
    </p>
  )
}
