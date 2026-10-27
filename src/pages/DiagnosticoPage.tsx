import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ResultsTable } from '../components/diagnostico/Results'
import {
  ContribuyenteTables,
  Glossary,
  ParametersTable,
  RentaTables,
  Timeline,
} from '../components/diagnostico/SiiTables'
import { StatusTag } from '../components/diagnostico/StatusTag'
import { DebtReportView } from '../components/deudas/DebtReportView'
import { Disclosure } from '../components/Disclosure'
import { Icon } from '../components/Icon'
import { ContingencySection } from '../components/numbers/ContingencySection'
import { CoverageSection } from '../components/numbers/CoverageSection'
import { AutoCredit, CreditFields, CreditTable } from '../components/numbers/CreditCapacitySection'
import { F29Section } from '../components/numbers/F29Section'
import { PropertyList, PropertyRegistry } from '../components/numbers/PatrimonySection'
import { BigValue, Delta, GoLink, KindGlyph } from '../components/panel/Bits'
import {
  CalcDetail,
  CalcLevels,
  type LevelEntry,
  type LevelGroup,
  type LevelKey,
} from '../components/panel/CalcLevels'
import { CreditCurve, YearBars } from '../components/panel/Charts'
import { SplitBar } from '../components/SplitBar'
import { Notice } from '../components/Notice'
import { RunGate } from '../components/RunGate'
import { useRun } from '../context/run'
import {
  ACTIVITY_TEXT,
  buildPropertyCalcs,
  buildRealEstate,
  buildYearCalcs,
  CREDIT_DISCLAIMER,
  CREDIT_HELP,
  CREDIT_TERMS,
  FIXED,
  kindHelp,
  kindLabel,
  statusHelp,
  statusLabel,
  usageByCode,
  usedBy,
  type Calc,
  type CalcStatus,
  type OperandKind,
  type PendingItem,
} from '../lib/calculos'
import { DEBT_TEXT } from '../lib/informeDeudas'
import { useCreditDraft } from '../lib/useCreditDraft'
import { scrollBehavior } from '../lib/dom'
import { downloadText, reportToCsv } from '../lib/export'
import { formatAt, formatDate, formatDecimal, formatMoney, formatMoneyMillions, formatRate } from '../lib/format'
import { CALC_GROUPS, DATA_TABS, resolvePlace, type ViewId } from '../lib/reportViews'
import { buildTimeline } from '../lib/timeline'
import { useHash } from '../lib/useHash'
import { yearDelta } from '../lib/variacion'
import type { Report, RunStatus } from '../types'

const KINDS: OperandKind[] = ['sii', 'param', 'calc']
const STATUSES: CalcStatus[] = ['calculado', 'por_confirmar', 'por_determinar']

// Cifras que se pueden ver por año en el Resumen.
const TRENDS = [
  { id: 'total-origenes', label: 'Ingreso declarado', format: formatMoneyMillions },
  { id: 'rfn-mensual', label: 'Renta neta al mes', format: formatMoney },
  { id: 'limite-hipotecario', label: 'Dividendo', format: formatMoney },
  { id: 'credit-capacity', label: 'Crédito', format: formatMoneyMillions },
] as const
type TrendId = (typeof TRENDS)[number]['id']

const NARROW = '(max-width: 1180px)'

export function DiagnosticoPage() {
  return <RunGate>{(report, run) => <DiagnosticoReport report={report} run={run} />}</RunGate>
}

function DiagnosticoReport({ report, run }: { report: Report; run: RunStatus }) {
  const { consent } = useRun()
  const { hash, key } = useHash()
  const lastView = useRef<ViewId | null>(null)
  const lastEntry = useRef<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const years = report.years
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked !== null && years.includes(picked) ? picked : years[years.length - 1]
  // Tasa y plazo del Credit Capacity: parten en la referencia y la persona los ajusta,
  // en el Resumen o en Crédito. Las dos vistas comparten lo escrito.
  const draft = useCreditDraft(report.method.mortgageRate, report.method.mortgageYears)
  const { credit } = draft
  const [showDelta, setShowDelta] = useState(true)
  const [trend, setTrend] = useState<TrendId>('credit-capacity')
  // Los niveles abiertos de un cálculo siguen abiertos al pasar al siguiente.
  const [levels, setLevels] = useState<Record<LevelKey, boolean>>({ operacion: false, origen: false })

  // Todo el informe sale del registro de cálculos: una vez por año y una vez por propiedades.
  const model = useMemo(() => {
    const byYear = new Map(years.map((item) => [item, buildYearCalcs(report, item, credit)]))
    const property = buildPropertyCalcs(report)
    const estate = buildRealEstate(property.summary)
    return { byYear, property, estate, timeline: buildTimeline(report) }
  }, [report, years, credit])

  // El fragmento de la URL decide la vista y el cálculo abierto. Abrir o cambiar un cálculo
  // no mueve la página: su explicación aparece al lado (o como hoja en pantallas angostas).
  const place = resolvePlace(hash)
  useEffect(() => {
    const { view, scrollTo, entry } = resolvePlace(hash)
    const changed = lastView.current !== null && lastView.current !== view
    const entryChanged = entry !== null && entry !== lastEntry.current
    lastView.current = view
    lastEntry.current = entry
    const element = scrollTo ? document.getElementById(scrollTo) : null
    if (element) {
      element.scrollIntoView({ behavior: scrollBehavior(), block: element.tagName === 'TR' ? 'center' : 'start' })
      return
    }
    if (changed) window.scrollTo({ top: 0 })
    if (view === 'calculos' && entryChanged) panelRef.current?.focus({ preventScroll: true })
  }, [hash, key])

  // Al terminar la captura el informe parte desde arriba, salvo que la dirección pida un dato.
  useEffect(() => {
    if (!resolvePlace(window.location.hash).scrollTo) window.scrollTo({ top: 0 })
  }, [])

  // En pantallas angostas el cálculo es una hoja: Escape la cierra.
  useEffect(() => {
    if (place.view !== 'calculos' || place.entry === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && window.matchMedia(NARROW).matches) window.location.hash = `grupo-${place.group}`
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [place.view, place.entry, place.group])

  if (year === undefined) {
    return (
      <Notice
        title="No hay declaraciones de renta para analizar"
        text="El informe necesita al menos una declaración anual (Formulario 22)."
      />
    )
  }

  const yearCalcs = model.byYear.get(year) ?? []
  const allCalcs = [...yearCalcs, ...model.property.calcs, ...model.estate.calcs]
  const byId = new Map(allCalcs.map((calc) => [calc.id, calc]))
  const users = usedBy(allCalcs)
  const usage = usageByCode(yearCalcs)
  const { summary } = model.property
  const { method } = report
  const open = allCalcs.filter((calc) => calc.status !== 'calculado')
  const calcOf = (id: string) => byId.get(id)
  const displayOf = (id: string) => byId.get(id)?.display ?? '—'
  const valueOf = (id: string) => byId.get(id)?.value ?? null
  const delta = (id: string) => (showDelta ? yearDelta(model.byYear, years, year, id) : null)

  // ---------- Cálculos por niveles ----------
  const fromCalc = (calc: Calc): LevelEntry => ({
    key: calc.id,
    name: calc.name,
    question: calc.question,
    display: calc.display,
    status: calc.status,
    plain: calc.plain,
    statusNote: calc.statusNote,
    definition: calc.definition,
    check: calc.check,
    equation: calc.equation,
    inputs: null,
    from: calc.dependsOn.map((id) => ({ id, name: byId.get(id)?.name ?? id })),
    used: (users.get(calc.id) ?? []).map((item) => ({ id: item.id, name: item.name })),
  })
  const fromPending = (item: PendingItem): LevelEntry => ({
    key: item.id,
    name: item.name,
    question: item.name,
    display: '—',
    status: 'por_determinar',
    plain: null,
    statusNote: item.missing,
    definition: item.definition,
    check: null,
    equation: null,
    inputs: item.inputs,
    from: [],
    used: [],
  })
  const contingency: LevelEntry | null = report.contingency
    ? {
        key: 'contingencias',
        name: 'Contingencias tributarias',
        question: 'Contingencias tributarias',
        display: '',
        status: null,
        plain: null,
        statusNote: null,
        definition: null,
        check: null,
        equation: null,
        inputs: null,
        from: [],
        used: [],
        node: (
          <div className="pn-contingency">
            <p className="pn-plain">Usa un dato que informa la persona y no proviene del SII.</p>
            <ContingencySection contingency={report.contingency} as="h4" />
          </div>
        ),
      }
    : null
  const entryOf = (id: string): LevelEntry | null => {
    const calc = byId.get(id)
    if (calc) return fromCalc(calc)
    const pending = model.estate.pending.find((item) => item.id === id)
    if (pending) return fromPending(pending)
    return id === 'contingencias' ? contingency : null
  }
  const groups: LevelGroup[] = CALC_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    entries: group.ids.map(entryOf).filter((item) => item !== null),
  })).filter((group) => group.entries.length > 0)
  const group = groups.find((item) => item.id === place.group) ?? groups[0]
  const chosen = place.entry !== null ? group.entries.find((item) => item.key === place.entry) : undefined
  const entry = chosen ?? group.entries[0]

  // ---------- Piezas del Resumen ----------
  const capacity = calcOf('credit-capacity')
  const capacityUf = calcOf('credit-capacity-uf')
  const rate = calcOf('tasa-efectiva')
  const trendDef = TRENDS.find((item) => item.id === trend) ?? TRENDS[3]
  const trendValues = years.map((item) => model.byYear.get(item)?.find((calc) => calc.id === trend)?.value ?? null)
  const terms = CREDIT_TERMS(method, credit)
  const maxDebt = Math.max(1, ...summary.byBank.map((item) => item.debtUf ?? 0))
  const financed = report.properties.filter(
    (item) => item.enajenacionUf !== null && item.pagoContadoUf !== null && item.enajenacionUf > item.pagoContadoUf,
  ).length
  const focusCredit = () => {
    const field = document.getElementById('resumen-rate')
    if (!field) return
    field.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
    field.focus({ preventScroll: true })
  }
  const paymentSplit =
    valueOf('prop-patrimonio') !== null && valueOf('prop-pasivos') !== null ? (
      <SplitBar
        label="Activos divididos en lo pagado al contado y lo financiado"
        parts={[
          {
            key: 'patrimonio',
            label: 'Pagado al contado',
            href: '#calc-prop-patrimonio',
            value: valueOf('prop-patrimonio') ?? 0,
            display: displayOf('prop-patrimonio'),
            tone: 'solid',
          },
          {
            key: 'pasivos',
            label: 'Financiado',
            href: '#calc-prop-pasivos',
            value: valueOf('prop-pasivos') ?? 0,
            display: displayOf('prop-pasivos'),
            tone: 'hatched',
          },
        ]}
      />
    ) : (
      <p className="pn-note">{FIXED.noData}</p>
    )
  const banks = (
    <ul className="pn-banks" aria-label="Deuda de origen por institución">
      {summary.byBank.map((item) => (
        <li key={item.bank}>
          <span className="pn-bank-name">
            {item.bank}
            <span className="pn-note">
              {' '}
              · {item.properties} {item.properties === 1 ? 'propiedad' : 'propiedades'} ·{' '}
              {item.share === null ? '—' : formatRate(item.share, 1)}
            </span>
          </span>
          <span className="pn-bank-value">{item.debtUf === null ? '—' : `${formatDecimal(item.debtUf, 2)} UF`}</span>
          <span className="pn-track" aria-hidden="true">
            <i style={{ width: `${((item.debtUf ?? 0) / maxDebt) * 100}%` }} />
          </span>
          <span className="pn-bank-lev">
            <a href="#calc-leverage-institucion">Leverage</a>
            <StatusTag status="por_determinar" />
          </span>
        </li>
      ))}
    </ul>
  )
  const about = (
    <dl className="pn-about">
      <div>
        <dt>Fecha de nacimiento</dt>
        <dd>{report.taxpayer.birthDate ? formatDate(report.taxpayer.birthDate) : FIXED.noData}</dd>
      </div>
      <div>
        <dt>Inicio de actividades</dt>
        <dd>{report.taxpayer.activityStart ? formatDate(report.taxpayer.activityStart) : FIXED.noData}</dd>
      </div>
      <div>
        <dt>Declaraciones</dt>
        <dd>
          {formatAt(years[0])} a {formatAt(years[years.length - 1])}
        </dd>
      </div>
      <div>
        <dt>UF usada</dt>
        <dd>
          ${formatDecimal(method.uf.value, 2)} · {formatDate(method.uf.date)}
        </dd>
      </div>
      <div>
        <dt>UTA de {formatAt(year)}</dt>
        <dd>{method.utaByYear[year] === undefined ? FIXED.noData : formatMoney(method.utaByYear[year])}</dd>
      </div>
    </dl>
  )
  const notes = (
    <div className="pn-notes">
      <p>
        <strong>Responsabilidad.</strong> El informe aplica procesos de decodificación y análisis de datos
        similares a los que utilizan las instituciones financieras. No constituye un instrumento oficial.
      </p>
      <p>
        <strong>Alcance.</strong> El informe es confidencial y sintetiza la posición económica, financiera y
        tributaria a partir de información dispuesta por el Servicio de Impuestos Internos.
      </p>
    </div>
  )

  return (
    <div className="report">
      <header className="pn-top">
        <div className="pn-top-case">
          <h1>Diagnóstico Base</h1>
          <p>
            {report.taxpayer.name} · <span className="mono">{report.taxpayer.rut}</span> · datos capturados el{' '}
            {formatDate(report.taxpayer.capturedAt)}
            <span className="print-only"> · {formatAt(year)}</span>
          </p>
        </div>
        <div className="pn-top-actions no-print">
          <div className="pn-years" role="group" aria-label="Año tributario">
            {years.map((item) => (
              <button key={item} type="button" aria-pressed={item === year} onClick={() => setPicked(item)}>
                {formatAt(item)}
              </button>
            ))}
          </div>
          <button type="button" className="pn-iconbtn" onClick={() => window.print()} aria-label="Descargar PDF">
            <Icon name="download" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            className="pn-iconbtn"
            aria-label="Descargar datos (CSV)"
            onClick={() => downloadText('innovacred-diagnostico-base.csv', reportToCsv(report))}
          >
            <Icon name="download" />
            <span>CSV</span>
          </button>
          <Link to="/" className="pn-textbtn">
            Nueva captura
          </Link>
        </div>
      </header>

      {run.status === 'PARTIAL' && (
        <section className="banner banner-warn" role="status">
          <strong>Captura parcial.</strong> {run.message}
        </section>
      )}

      <div className="pn-page">
        <section className="print-only pn-print-about" aria-label="Datos de este informe">
          <h2 className="pn-sub">Datos de este informe</h2>
          {about}
          {notes}
        </section>

        {/* ---------- Resumen ---------- */}
        <section data-view="resumen" className="view" hidden={place.view !== 'resumen'}>
          <ViewHead
            title={`Resumen del ${formatAt(year)}`}
            lead="De lo declarado en el SII al crédito que paga esa renta."
            actions={
              <>
                <button type="button" className="pn-btn" aria-pressed={showDelta} onClick={() => setShowDelta((value) => !value)}>
                  Variación entre años
                </button>
                <button type="button" className="pn-btn pn-btn-dark" onClick={focusCredit}>
                  Cambiar tasa y plazo
                </button>
              </>
            }
          />
          <div className="pn-grid">
            {capacity && (
              <Kpi calc={capacity} label="Crédito que paga el dividendo" note={terms} delta={delta('credit-capacity')} dark />
            )}
            {(['total-origenes', 'rfn-mensual', 'limite-hipotecario'] as const).map((id) => {
              const calc = calcOf(id)
              const label = { 'total-origenes': 'Ingreso declarado', 'rfn-mensual': 'Renta neta al mes', 'limite-hipotecario': 'Dividendo de referencia' }[id]
              return calc ? <Kpi key={id} calc={calc} label={label} note={calc.name} delta={delta(id)} /> : null
            })}

            <Activities report={report} />

            <section id="financiero" className="pn-card s8" aria-labelledby="por-ano">
              <div className="pn-card-head">
                <h3 id="por-ano">Por año tributario</h3>
                <div className="pn-seg no-print" role="group" aria-label="Cifra del gráfico">
                  {TRENDS.map((item) => (
                    <button key={item.id} type="button" aria-pressed={item.id === trend} onClick={() => setTrend(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <YearBars years={years} values={trendValues} selected={year} format={trendDef.format} label={trendDef.label} />
              {trend === 'credit-capacity' && <p className="pn-note">Cada año con la misma tasa y plazo: {terms}.</p>}
              <Disclosure label="Ver las cifras de cada año en una tabla">
                <ResultsTable report={report} byYear={model.byYear} selected={year} />
              </Disclosure>
            </section>

            <section className="pn-card s4" aria-labelledby="tasa-plazo">
              <div className="pn-card-head">
                <h3 id="tasa-plazo">Tasa y plazo</h3>
              </div>
              <CreditFields report={report} draft={draft} idPrefix="resumen" />
              <p className="pn-terms print-only">{terms}</p>
              {capacityUf && (
                <p className="pn-uf">
                  <span>En UF:</span>
                  <a href="#calc-credit-capacity-uf">{capacityUf.display}</a>
                  <StatusTag status={capacityUf.status} />
                </p>
              )}
              <p className="pn-note">{CREDIT_HELP(method)}</p>
            </section>

            {rate && (
              <section className="pn-card s4" aria-labelledby="tasa-efectiva">
                <div className="pn-card-head">
                  <h3 id="tasa-efectiva">Tasa efectiva</h3>
                  <GoLink href="#calc-tasa-efectiva" label="Abrir el cálculo de la tasa efectiva" />
                </div>
                <p className="pn-figure">
                  <BigValue display={rate.display} />
                </p>
                <TaxShare calc={rate} />
                <p className="pn-plain-sm">{rate.plain}</p>
                <Delta text={delta('tasa-efectiva')} />
              </section>
            )}

            <section className="pn-card s4 resumen-properties" aria-labelledby="resumen-propiedades">
              <div className="pn-card-head">
                <h3 id="resumen-propiedades">Propiedades</h3>
                <GoLink href="#propiedades" label="Ver las propiedades" />
              </div>
              {summary.count === 0 ? (
                <p className="pn-note">{FIXED.noProperties}</p>
              ) : (
                <>
                  <p className="pn-note">
                    {summary.count} {summary.count === 1 ? 'propiedad comprada' : 'propiedades compradas'} por
                  </p>
                  <p className="pn-figure pn-figure-sm">
                    <BigValue display={displayOf('prop-activos')} />
                  </p>
                  {paymentSplit}
                </>
              )}
            </section>

            <section className="pn-card s4" aria-labelledby="resumen-deuda">
              <div className="pn-card-head">
                <h3 id="resumen-deuda">Deuda de origen</h3>
                <GoLink href="#calc-deuda-institucion" label="Abrir el cálculo de la deuda por institución" />
              </div>
              {summary.byBank.length === 0 ? <p className="pn-note">Ninguna propiedad tiene crédito.</p> : banks}
            </section>
          </div>
        </section>

        {/* ---------- Cálculos ---------- */}
        <section data-view="calculos" className="view" hidden={place.view !== 'calculos'}>
          <ViewHead
            title="Cálculos"
            lead={`${formatAt(year)}. Primero la respuesta; la operación y el origen de cada dato, cuando los pidas.`}
          />
          <CalcLevels
            ref={panelRef}
            groups={groups}
            group={group}
            entry={entry}
            chosen={chosen !== undefined}
            open={levels}
            onToggle={(level) => setLevels((value) => ({ ...value, [level]: !value[level] }))}
          />
          <div className="print-only pn-print-calcs">
            {groups.map((item) => (
              <section key={item.id} className="pn-print-group">
                <h3 className="pn-print-group-title">{item.title}</h3>
                {item.entries.map((calc, index) => (
                  <CalcDetail key={calc.key} entry={calc} group={item} position={index + 1} print />
                ))}
              </section>
            ))}
          </div>
        </section>

        {/* ---------- Crédito ---------- */}
        <section data-view="credito" className="view" hidden={place.view !== 'credito'}>
          <ViewHead
            title="Crédito"
            lead={`Con el dividendo de referencia de ${displayOf('limite-hipotecario')} al mes, ${formatAt(year)}.`}
            actions={
              <a className="pn-btn no-print" href="#calc-credit-capacity">
                Ver el cálculo
              </a>
            }
          />
          <div className="pn-grid">
            {capacity && (
              <section className="pn-card is-dark s5 credit-inputs" aria-labelledby="credito-monto">
                <div className="pn-card-head">
                  <h3 id="credito-monto" className="pn-card-q">
                    {capacity.question}
                  </h3>
                  <StatusTag status={capacity.status} />
                </div>
                <p className="pn-hero" aria-live="polite">
                  <BigValue display={capacity.display} />
                </p>
                {capacityUf && (
                  <p className="pn-uf">
                    <a href="#calc-credit-capacity-uf">{capacityUf.display}</a>
                    <StatusTag status={capacityUf.status} />
                  </p>
                )}
                <CreditFields report={report} draft={draft} idPrefix="sim" tone="dark" />
                <p className="pn-terms print-only">{terms}</p>
                <p className="pn-note">{CREDIT_HELP(method)}</p>
              </section>
            )}
            <section className="pn-card is-white s7" aria-labelledby="credito-plazo">
              <div className="pn-card-head">
                <h3 id="credito-plazo">El crédito según el plazo</h3>
                <span className="pn-note">Misma tasa y dividendo</span>
              </div>
              {valueOf('limite-hipotecario') !== null ? (
                <CreditCurve dividend={valueOf('limite-hipotecario') ?? 0} rate={credit.rate} years={credit.years} />
              ) : (
                <p className="pn-note">{FIXED.noData}</p>
              )}
            </section>
            <Leverage calc={calcOf('factor-leverage')} uf={capacityUf?.display ?? '—'} />
            <section className="pn-card s5" aria-labelledby="credito-auto">
              <div className="pn-card-head">
                <h3 id="credito-auto">Crédito automotriz</h3>
                <GoLink href="#calc-cuota-automotriz" label="Abrir el cálculo de la cuota automotriz" />
              </div>
              <AutoCredit report={report} calcs={yearCalcs} />
            </section>
            <section className="pn-card s12">
              <Disclosure label="Tabla de referencia por tasa y plazo">
                <CreditTable report={report} calcs={yearCalcs} credit={credit} />
              </Disclosure>
              <p className="pn-note">
                {capacityUf?.statusNote} {CREDIT_DISCLAIMER}
              </p>
            </section>
          </div>
        </section>

        {/* ---------- Propiedades ---------- */}
        <section data-view="propiedades" className="view" hidden={place.view !== 'propiedades'}>
          <ViewHead
            title="Propiedades"
            lead={`${summary.count} ${summary.count === 1 ? 'bien raíz inscrito' : 'bienes raíces inscritos'} a nombre de la persona, según “Mis Bienes” del SII. Montos de compra, en UF.`}
          />
          {summary.count === 0 ? (
            <PropertyList report={report} />
          ) : (
            <div className="pn-grid">
              <div className="pn-strip s12" role="group" aria-label="Cifras de las propiedades">
                <Stat label="Propiedades" value={String(summary.count)} note={`${financed} con crédito`} />
                <Stat label="Activos" display={displayOf('prop-activos')} href="#calc-prop-activos" />
                <Stat label="Patrimonio" display={displayOf('prop-patrimonio')} href="#calc-prop-patrimonio" />
                <Stat label="Pasivos de origen" display={displayOf('prop-pasivos')} href="#calc-prop-pasivos" />
                <Stat label="Avalúo fiscal" display={formatMoneyMillions(summary.avaluoTotal)} note={formatMoney(summary.avaluoTotal)} />
              </div>
              <section className="pn-card s5" aria-labelledby="como-se-pagaron">
                <div className="pn-card-head">
                  <h3 id="como-se-pagaron">Cómo se pagaron</h3>
                </div>
                <p className="pn-note">Del total de compra de {displayOf('prop-activos')}</p>
                {paymentSplit}
              </section>
              <section id="financiamiento" className="pn-card s7" aria-labelledby="deuda-por-institucion">
                <div className="pn-card-head">
                  <h3 id="deuda-por-institucion">Deuda de origen por institución</h3>
                  <a className="pn-link" href="#calc-deuda-institucion">
                    Ver el cálculo
                  </a>
                </div>
                {summary.byBank.length === 0 ? <p className="pn-note">Ninguna propiedad tiene crédito.</p> : banks}
                <p className="pn-note">Es lo financiado al comprar, no la deuda vigente.</p>
              </section>
              <section id="patrimonio" className="pn-card is-white s12" aria-labelledby="las-propiedades">
                <div className="pn-card-head">
                  <h3 id="las-propiedades">
                    Las {summary.count} {summary.count === 1 ? 'propiedad' : 'propiedades'}
                  </h3>
                  <span className="pn-note">Montos de compra en UF</span>
                </div>
                <PropertyList report={report} />
                <PropertyRegistry report={report} as="h3" />
              </section>
              <section className="pn-card s4" aria-labelledby="por-destino">
                <h3 id="por-destino">Por destino</h3>
                <Counts items={summary.byDestino} />
              </section>
              <section className="pn-card s4" aria-labelledby="por-comuna">
                <h3 id="por-comuna">Por comuna</h3>
                <Counts items={summary.byComuna} />
              </section>
              {calcOf('ley-20455') && (
                <section className="pn-card s4" aria-labelledby="ley-20455">
                  <div className="pn-card-head">
                    <h3 id="ley-20455">Ley 20.455</h3>
                    <GoLink href="#calc-ley-20455" label="Abrir el cálculo de la Ley 20.455" />
                  </div>
                  <p className="pn-figure pn-figure-sm">
                    <BigValue display={displayOf('ley-20455')} />
                  </p>
                  <p className="pn-plain-sm">{calcOf('ley-20455')?.plain}</p>
                </section>
              )}
            </div>
          )}
        </section>

        {/* ---------- Datos del SII ---------- */}
        <section data-view="datos" className="view pn-plain-view" hidden={place.view !== 'datos'}>
          <ViewHead
            title="Datos del SII"
            lead={`Las tablas tal como se capturaron. La columna “Se usa en” indica qué cálculos toman cada dato; la columna destacada es ${formatAt(year)}.`}
          />
          <nav className="pn-seg pn-subtabs no-print" aria-label="Tablas del SII">
            {DATA_TABS.map((tab) => (
              <a key={tab.id} href={`#datos-${tab.id}`} aria-current={tab.id === place.dataTab ? 'true' : undefined}>
                {tab.label}
              </a>
            ))}
          </nav>
          <div className="data-panel" hidden={place.dataTab !== 'renta'}>
            <RentaTables report={report} usage={usage} selected={year} />
          </div>
          <div className="data-panel" hidden={place.dataTab !== 'mensuales'}>
            <F29Section report={report} as="h3" />
          </div>
          <div className="data-panel" hidden={place.dataTab !== 'contribuyente'}>
            <ContribuyenteTables report={report} />
            <Timeline days={model.timeline} />
          </div>
          <div className="data-panel" hidden={place.dataTab !== 'fuentes'}>
            <CoverageSection report={report} consent={consent} as="h3" />
          </div>
        </section>

        {/* ---------- Pendientes ---------- */}
        <section data-view="pendientes" className="view pn-plain-view" hidden={place.view !== 'pendientes'}>
          <ViewHead
            title="Pendientes"
            lead="Los cálculos a los que les falta confirmar un dato o un supuesto, y los que aún no se pueden calcular. Cada nombre abre su cálculo."
          />
          <ul className="pending-list">
            {open.map((calc) => (
              <li key={calc.id}>
                <StatusTag status={calc.status} />
                <a href={`#calc-${calc.id}`}>{calc.name}</a>
                <span>{calc.statusNote}</span>
              </li>
            ))}
            {model.estate.pending.map((item) => (
              <li key={item.id}>
                <StatusTag status="por_determinar" />
                <a href={`#calc-${item.id}`}>{item.name}</a>
                <span>{item.missing}</span>
              </li>
            ))}
          </ul>
          <div className="card-flush">
            <div className="card-head">
              <h3 className="card-heading">Valores de referencia en uso</h3>
            </div>
            <ParametersTable report={report} />
          </div>
        </section>

        {/* ---------- Glosario ---------- */}
        <section data-view="glosario" className="view pn-plain-view" hidden={place.view !== 'glosario'}>
          <ViewHead title="Glosario" lead="Qué significa cada término, cada estado y cada tipo de dato del informe." />
          <Glossary />
          <div className="pn-legend">
            <section aria-labelledby="leer-estados">
              <h3 id="leer-estados">Cómo leer los estados</h3>
              <ul>
                {STATUSES.map((status) => (
                  <li key={status}>
                    <StatusTag status={status} />
                    <span>{statusHelp[status]}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="leer-datos">
              <h3 id="leer-datos">Tipos de dato</h3>
              <ul>
                {KINDS.map((kind) => (
                  <li key={kind}>
                    <span className="pn-kind">
                      <KindGlyph kind={kind} />
                      {kindLabel[kind]}
                    </span>
                    <span>{kindHelp[kind]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section className="no-print pn-about-block" aria-labelledby="datos-informe">
            <h3 id="datos-informe">Datos de este informe</h3>
            {about}
            {notes}
          </section>
        </section>

        {/* ---------- Informe de deudas (complemento opcional, al final de la carpeta) ---------- */}
        <section data-view="deudas" className="view pn-plain-view dr-view" hidden={place.view !== 'deudas'}>
          <div className="no-print">
            <ViewHead title={DEBT_TEXT.title} lead={DEBT_TEXT.lead} actions={<span className="dr-tag">{DEBT_TEXT.tag}</span>} />
          </div>
          <DebtReportView />
        </section>

        <footer className="report-foot">
          <p>
            Este informe es referencial y no constituye una decisión tributaria ni crediticia.{' '}
            {report.warnings.join(' ')}
          </p>
          <p>
            {report.taxpayer.name} · {report.taxpayer.rut} · datos capturados el {formatDate(report.taxpayer.capturedAt)} ·{' '}
            {STATUSES.map((status) => statusLabel[status]).join(' / ')}
          </p>
        </footer>
      </div>
    </div>
  )
}

// Actividades económicas registradas en el SII: el dato y su origen, sin evaluarlo.
function Activities({ report }: { report: Report }) {
  const { activities } = report
  return (
    <section className="pn-card s12 pn-acts" aria-labelledby="resumen-actividades">
      <div className="pn-card-head">
        <h3 id="resumen-actividades">{ACTIVITY_TEXT.title}</h3>
        <span className="pn-acts-src">
          <span className="pn-note">{ACTIVITY_TEXT.source}</span>
          <GoLink href="#actividades" label="Ver las actividades en Datos del SII" />
        </span>
      </div>
      {activities.length === 0 ? (
        <p className="pn-note">{ACTIVITY_TEXT.none}</p>
      ) : (
        <ul className="pn-acts-list">
          {activities.map((item) => (
            <li key={item.code}>
              <span className="pn-act-code" translate="no">
                <span className="sr-only">Código </span>
                {item.code}
              </span>
              <span className="pn-act-name">{item.label}</span>
              <dl className="pn-act-meta">
                <div>
                  <dt>Categoría</dt>
                  <dd>{item.category}</dd>
                </div>
                <div>
                  <dt>Afecta IVA</dt>
                  <dd>{ACTIVITY_TEXT.afectaIva(item.afectaIva)}</dd>
                </div>
                <div>
                  <dt>Desde</dt>
                  <dd>{formatDate(item.startDate)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ViewHead({ title, lead, actions }: { title: string; lead: string; actions?: ReactNode }) {
  return (
    <div className="pn-head">
      <div>
        <h2 className="pn-title">{title}</h2>
        <p className="pn-lead">{lead}</p>
      </div>
      {actions && <div className="pn-head-actions">{actions}</div>}
    </div>
  )
}

function Kpi({
  calc,
  label,
  note,
  delta,
  dark = false,
}: {
  calc: Calc
  label: string
  note: string
  delta: string | null
  dark?: boolean
}) {
  return (
    <article className={`pn-card pn-kpi s3${dark ? ' is-dark' : ''}`} data-kpi={calc.id}>
      <div className="pn-kpi-top">
        <h3>{label}</h3>
        <GoLink href={`#calc-${calc.id}`} label={`Abrir el cálculo de ${calc.name}`} />
      </div>
      <p className="pn-kpi-value" aria-live={dark ? 'polite' : undefined}>
        <BigValue display={calc.display} />
      </p>
      <div className="pn-kpi-foot">
        <Delta text={delta} />
        <span className="pn-note">{note}</span>
      </div>
    </article>
  )
}

// La tasa efectiva como parte de la base imponible: la base es todo el ancho y el impuesto, una parte.
function TaxShare({ calc }: { calc: Calc }) {
  const equation = calc.equation
  if (equation?.kind !== 'arith' || equation.terms.length < 2 || calc.value === null) return null
  const [tax, base] = equation.terms.map((term) => term.operand)
  const share = Math.min(1, Math.max(0, calc.value))
  return (
    <figure className="split" aria-label={`Impuesto determinado: ${calc.display} de la base imponible`}>
      <div className="split-bar" aria-hidden="true">
        <span className="split-part split-solid" style={{ width: `${share * 100}%` }} />
        <span className="split-part split-hatched" style={{ width: `${(1 - share) * 100}%` }} />
      </div>
      <ul className="split-legend">
        <li>
          <span className="split-swatch split-solid" aria-hidden="true" />
          <span className="split-label">{tax.label}, código {tax.code}</span>
          <span className="split-value">{tax.display}</span>
        </li>
        <li>
          <span className="split-swatch split-hatched" aria-hidden="true" />
          <span className="split-label">
            {base.label}, código {base.code} (todo el ancho)
          </span>
          <span className="split-value">{base.display}</span>
        </li>
      </ul>
    </figure>
  )
}

// Los cinco montos del leverage son el mismo por 1 a 5: van como cifras, sin gráfico.
function Leverage({ calc, uf }: { calc: Calc | undefined; uf: string }) {
  if (!calc) return null
  const rows = calc.equation?.kind === 'multiples' ? calc.equation.rows : []
  return (
    <section className="pn-card s7" aria-labelledby="credito-leverage">
      <div className="pn-card-head">
        <h3 id="credito-leverage">{calc.question}</h3>
        <StatusTag status={calc.status} />
      </div>
      <p className="pn-note">
        Credit Capacity de <strong>{uf}</strong> multiplicado por cada factor.
      </p>
      {rows.length === 0 ? (
        <p className="pn-note">{calc.plain}</p>
      ) : (
        <ul className="pn-mults" aria-label="Factor leverage">
          {rows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <strong>{row.result}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="pn-note">{calc.definition}</p>
    </section>
  )
}

function Stat({
  label,
  value,
  display,
  note,
  href,
}: {
  label: string
  value?: string
  display?: string
  note?: string
  href?: string
}) {
  return (
    <div className="pn-stat">
      <span className="pn-stat-label">{label}</span>
      <span className="pn-stat-value">{display ? <BigValue display={display} /> : value}</span>
      {href ? (
        <a className="pn-stat-note" href={href}>
          Ver el cálculo
        </a>
      ) : (
        <span className="pn-stat-note">{note}</span>
      )}
    </div>
  )
}

function Counts({ items }: { items: { name: string; count: number }[] }) {
  return (
    <ul className="pn-counts">
      {items.map((item) => (
        <li key={item.name}>
          <span>{item.name}</span>
          <strong>{item.count}</strong>
        </li>
      ))}
    </ul>
  )
}
