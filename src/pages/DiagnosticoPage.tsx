import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalcBlock } from '../components/diagnostico/CalcBlock'
import { CalcExplorer, type ExplorerEntry, type ExplorerGroup } from '../components/diagnostico/CalcExplorer'
import { MoneyWaterfall } from '../components/diagnostico/MoneyWaterfall'
import { PendingSection } from '../components/diagnostico/PendingSection'
import { ResultsHero, ResultsTable, YearPicker } from '../components/diagnostico/Results'
import {
  ContribuyenteTables,
  Glossary,
  ParametersTable,
  RentaTables,
  Timeline,
} from '../components/diagnostico/SiiTables'
import { StatusTag } from '../components/diagnostico/StatusTag'
import { Disclosure } from '../components/Disclosure'
import { ContingencySection } from '../components/numbers/ContingencySection'
import { CoverageSection } from '../components/numbers/CoverageSection'
import { AutoCredit, CreditInputs, CreditTable } from '../components/numbers/CreditCapacitySection'
import { F29Section } from '../components/numbers/F29Section'
import { PatrimonySection } from '../components/numbers/PatrimonySection'
import { Notice } from '../components/Notice'
import { RunGate } from '../components/RunGate'
import { StatTile } from '../components/StatTile'
import { useRun } from '../context/run'
import {
  buildPropertyCalcs,
  buildRealEstate,
  buildYearCalcs,
  kindLabel,
  statusLabel,
  usageByCode,
  usedBy,
  type Calc,
  type CalcStatus,
  type CreditChoice,
  type OperandKind,
} from '../lib/calculos'
import { scrollBehavior } from '../lib/dom'
import { downloadText, reportToCsv } from '../lib/export'
import { formatAt, formatDate, formatDecimal, formatExact, formatMoney, formatRateExact } from '../lib/format'
import { CREDIT_CALCS, DATA_TABS, VIEWS, resolvePlace, type ViewId } from '../lib/reportViews'
import { ANALYSIS_PATH } from '../lib/routes'
import { buildTimeline } from '../lib/timeline'
import { useHash } from '../lib/useHash'
import type { Report, RunStatus } from '../types'

const KINDS: OperandKind[] = ['sii', 'param', 'calc']
const STATUSES: CalcStatus[] = ['calculado', 'por_confirmar', 'por_determinar']
// Cálculos del año que siguen el camino tributario; el resto sigue el financiero.
const TAX_IDS = [
  'total-origenes',
  'total-rebajas',
  'base-imponible',
  'tasa-efectiva',
  'bit-uta',
  'tramo-55bis',
  'tope-55bis',
  'tramo-igc',
]
const PROPERTY_HERO = ['prop-activos', 'prop-patrimonio', 'prop-pasivos']

const kindHelp: Record<OperandKind, string> = {
  sii: 'Lo declarado o registrado en el SII, con su formulario, código y año.',
  param: 'Un valor que fija el método, igual para todas las personas.',
  calc: 'El resultado de otro cálculo de este informe.',
}

const statusHelp: Record<CalcStatus, string> = {
  calculado: 'La fórmula está definida por el método y reproduce los casos de referencia.',
  por_confirmar: 'Se calcula con una regla deducida de los casos o con un parámetro supuesto.',
  por_determinar: 'Falta la fórmula o el dato. Se muestra lo que ya se tiene y lo que falta.',
}

export function DiagnosticoPage() {
  return <RunGate>{(report, run) => <DiagnosticoReport report={report} run={run} />}</RunGate>
}

function DiagnosticoReport({ report, run }: { report: Report; run: RunStatus }) {
  const { consent } = useRun()
  const { hash, key } = useHash()
  const viewsRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const lastView = useRef<ViewId | null>(null)
  const years = report.years
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked !== null && years.includes(picked) ? picked : years[years.length - 1]
  // Tasa y plazo del Credit Capacity: parten en la referencia y la persona los ajusta.
  const [chosen, setChosen] = useState<CreditChoice | null>(null)
  const { mortgageRate, mortgageYears } = report.method
  const credit = useMemo(
    () => chosen ?? { rate: mortgageRate, years: mortgageYears },
    [chosen, mortgageRate, mortgageYears],
  )

  // Todo el informe sale del registro de cálculos: una vez por año y una vez por propiedades.
  const model = useMemo(() => {
    const byYear = new Map(years.map((item) => [item, buildYearCalcs(report, item, credit)]))
    const property = buildPropertyCalcs(report)
    const estate = buildRealEstate(property.summary)
    return { byYear, property, estate, timeline: buildTimeline(report) }
  }, [report, years, credit])

  // El fragmento de la URL decide la vista. Al cambiar, se lleva a la persona al dato
  // pedido; si se cambió de vista y la nueva quedó tapada por la barra, se vuelve a su inicio.
  // Abrir o cerrar un cálculo no mueve la página: su explicación aparece al lado.
  // Las vistas y los cálculos no llevan id para que el navegador no la mueva por su cuenta.
  const place = resolvePlace(hash)
  useEffect(() => {
    const { view, scrollTo } = resolvePlace(hash)
    const changed = lastView.current !== null && lastView.current !== view
    lastView.current = view
    const element = scrollTo ? document.getElementById(scrollTo) : null
    if (element) {
      element.scrollIntoView({ behavior: scrollBehavior(), block: element.tagName === 'TR' ? 'center' : 'start' })
      return
    }
    const barBottom = barRef.current?.getBoundingClientRect().bottom ?? 0
    const top = viewsRef.current?.getBoundingClientRect().top
    if (changed && top !== undefined && top < barBottom) window.scrollBy({ top: top - barBottom - 12 })
  }, [hash, key])

  if (year === undefined) {
    return (
      <Notice
        title="No hay declaraciones de renta para analizar"
        text="El informe necesita al menos una declaración anual (Formulario 22)."
      />
    )
  }

  const yearCalcs = model.byYear.get(year) ?? []
  const taxCalcs = yearCalcs.filter((calc) => TAX_IDS.includes(calc.id))
  const moneyCalcs = yearCalcs.filter((calc) => !TAX_IDS.includes(calc.id))
  const allCalcs = [...taxCalcs, ...moneyCalcs, ...model.property.calcs, ...model.estate.calcs]
  const byId = new Map(allCalcs.map((calc) => [calc.id, calc]))
  const numberOf = new Map(allCalcs.map((calc, index) => [calc.id, index + 1]))
  const users = usedBy(allCalcs)
  const usage = usageByCode(yearCalcs)
  const { summary } = model.property
  const open = allCalcs.filter((calc) => calc.status !== 'calculado')
  const pendingCount = open.length + model.estate.pending.length

  const block = (calc: Calc) => (
    <CalcBlock
      number={numberOf.get(calc.id) ?? 0}
      total={allCalcs.length}
      calc={calc}
      usedBy={users.get(calc.id) ?? []}
      byId={byId}
    />
  )
  const entry = (calc: Calc): ExplorerEntry => ({
    key: calc.id,
    name: calc.name,
    value: calc.display,
    status: calc.status,
    number: numberOf.get(calc.id) ?? null,
    node: block(calc),
  })
  // El Credit Capacity y lo que sale de él se explican en su propia vista, junto a la tasa y el plazo.
  const creditCalcs = moneyCalcs.filter((calc) => CREDIT_CALCS.includes(calc.id))
  const creditOpen = creditCalcs.find((calc) => calc.id === place.entry)?.id ?? creditCalcs[0]?.id
  const groups: ExplorerGroup[] = [
    {
      id: 'renta',
      title: 'Renta e impuesto',
      source: { label: 'Formulario 22', href: '#origenes' },
      entries: taxCalcs.map(entry),
    },
    {
      id: 'credito',
      title: 'Renta financiera',
      next: { label: 'El Credit Capacity sigue en la pestaña Crédito', href: '#credito' },
      entries: moneyCalcs.filter((calc) => !CREDIT_CALCS.includes(calc.id)).map(entry),
    },
    {
      id: 'propiedades',
      title: 'Propiedades',
      source: { label: 'Bienes raíces', href: '#patrimonio' },
      entries: model.property.calcs.map(entry),
    },
    {
      id: 'inmobiliario',
      title: 'Análisis inmobiliario',
      entries: [
        ...model.estate.calcs.map(entry),
        ...model.estate.pending.map((item) => ({
          key: item.id,
          name: item.name,
          value: '—',
          status: 'por_determinar' as const,
          number: null,
          node: <PendingSection item={item} />,
        })),
      ],
    },
    ...(report.contingency
      ? [
          {
            id: 'contingencias',
            title: 'Contingencias',
            entries: [
              {
                key: 'contingencias',
                name: 'Contingencias tributarias',
                value: '',
                status: null,
                number: null,
                node: (
                  <div data-calc="contingencias" className="chapter">
                    <p className="chapter-lead">
                      Cálculo del Capítulo IV. Usa un dato que informa el cliente y no proviene del SII.
                    </p>
                    <ContingencySection contingency={report.contingency} as="h3" />
                  </div>
                ),
              },
            ],
          },
        ]
      : []),
  ]
  const known = groups.some((group) => group.entries.some((item) => item.key === place.entry))

  return (
    <div className="report">
      <header className="report-head">
        <div className="report-title">
          <div className="eyebrow">Diagnóstico Base · Método ICRED</div>
          <h1>Informe de apertura</h1>
          <p className="report-who">
            {report.taxpayer.name} · <span className="mono">{report.taxpayer.rut}</span> · datos capturados
            el {formatDate(report.taxpayer.capturedAt)}
          </p>
        </div>
        <div className="page-actions no-print">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Descargar PDF
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => downloadText('diagnostico-base.csv', reportToCsv(report))}
          >
            Descargar datos (CSV)
          </button>
          <Link to="/" className="btn">
            Nueva captura
          </Link>
        </div>
      </header>

      {run.status === 'PARTIAL' && (
        <section className="banner banner-warn" role="status">
          <strong>Captura parcial.</strong> {run.message}
        </section>
      )}

      <div className="report-bar no-print" ref={barRef}>
        <nav className="tabs" aria-label="Secciones del informe">
          {VIEWS.map((view) => (
            <a
              key={view.id}
              className="tab"
              href={`#${view.id}`}
              aria-current={view.id === place.view ? 'page' : undefined}
            >
              {view.label}
              {view.id === 'pendientes' && <span className="tab-count">{pendingCount}</span>}
            </a>
          ))}
        </nav>
        <YearPicker years={years} selected={year} onSelect={setPicked} />
      </div>

      <div className="report-views" ref={viewsRef}>
        <section data-view="resumen" className="view chapter" hidden={place.view !== 'resumen'}>
          <div className="report-about">
            <p className="cover-lead print-block">
              Este informe muestra lo que está declarado en el SII y los cálculos que el método hace
              con esos datos. Cada resultado indica qué es, cómo se calcula y de qué dato proviene.
            </p>
            <dl className="cover-meta">
              <div>
                <dt>Fecha de nacimiento</dt>
                <dd>{report.taxpayer.birthDate ? formatDate(report.taxpayer.birthDate) : 'Dato no capturado'}</dd>
              </div>
              <div>
                <dt>Inicio de actividades</dt>
                <dd>
                  {report.taxpayer.activityStart ? formatDate(report.taxpayer.activityStart) : 'Dato no capturado'}
                </dd>
              </div>
              <div>
                <dt>Declaraciones</dt>
                <dd>
                  {formatAt(years[0])} a {formatAt(years[years.length - 1])}
                </dd>
              </div>
              <div>
                <dt>UF de referencia</dt>
                <dd>
                  ${formatDecimal(report.method.uf.value, 2)} · {formatDate(report.method.uf.date)}
                </dd>
              </div>
              <div>
                <dt>UTA de {formatAt(year)}</dt>
                <dd>
                  {report.method.utaByYear[year] === undefined
                    ? 'Dato no capturado'
                    : formatMoney(report.method.utaByYear[year])}
                </dd>
              </div>
              <div>
                <dt>Reglas del método</dt>
                <dd>{report.method.release}</dd>
              </div>
            </dl>
            <div className="cover-notes">
              <p>
                <strong>Responsabilidad.</strong> El informe aplica procesos de decodificación y
                análisis de datos similares a los que utilizan las instituciones financieras. No
                constituye un instrumento oficial.
              </p>
              <p>
                <strong>Alcance.</strong> El informe es confidencial y sintetiza la posición
                económica, financiera y tributaria a partir de información dispuesta por el Servicio
                de Impuestos Internos.
              </p>
            </div>
          </div>

          <h2>Resultado del análisis · {formatAt(year)}</h2>
          <ResultsHero calcs={yearCalcs} />

          <h3 className="chapter-sub">Propiedades inscritas</h3>
          <ResultsHero calcs={model.property.calcs} ids={PROPERTY_HERO} />

          <div id="financiero" className="card-flush section-card">
            <div className="card-head">
              <h3 className="card-heading">Análisis financiero por año</h3>
              <div className="card-note">
                Credit Capacity con {formatRateExact(credit.rate)} anual a {formatExact(credit.years)} años
              </div>
            </div>
            <ResultsTable report={report} byYear={model.byYear} selected={year} />
          </div>

          <div className="card soon-card no-print">
            <div>
              <span className="tag tag-soon">Próximamente</span>
              <h2>Trabaja estos resultados con el agente</h2>
              <p>
                Cada hallazgo del análisis se podrá abrir para ver de dónde nace, hacerle preguntas y
                simular escenarios. Ya hay una vista previa con el caso de ejemplo.
              </p>
            </div>
            <Link to={ANALYSIS_PATH} className="btn btn-outline">
              Ver la vista previa
            </Link>
          </div>
        </section>

        <section data-view="calculos" className="view chapter" hidden={place.view !== 'calculos'}>
          <h2 className="view-title">Cómo se calcula cada resultado · {formatAt(year)}</h2>
          <CalcExplorer
            groups={groups}
            selected={known ? place.entry : null}
            lead={
              <p className="chapter-lead">
                Todos los cálculos de {formatAt(year)}, en el orden en que dependen unos de otros.
                <span className="no-print"> Presiona cualquiera para ver su explicación.</span>
              </p>
            }
          >
            <h3 className="chapter-sub">Cascada del dinero</h3>
            <MoneyWaterfall calcs={yearCalcs} />
            <h3 className="chapter-sub">Cómo leer cada cálculo</h3>
            <div className="legend">
              <div>
                <h4 className="legend-title">Tipos de dato</h4>
                <ul>
                  {KINDS.map((kind) => (
                    <li key={kind}>
                      <span className={`data-chip kind-${kind} chip-mini`}>{kindLabel[kind]}</span>
                      <span>{kindHelp[kind]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="legend-title">Estados</h4>
                <ul>
                  {STATUSES.map((status) => (
                    <li key={status}>
                      <StatusTag status={status} />
                      <span>{statusHelp[status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CalcExplorer>
        </section>

        <section data-view="credito" className="view chapter" hidden={place.view !== 'credito'}>
          <h2 className="view-title">Crédito · {formatAt(year)}</h2>
          <p className="chapter-lead">
            Cuánto crédito se puede pagar con el dividendo de referencia de {formatAt(year)}. No hay
            una tasa ni un plazo únicos: dependen de cada institución.
            <span className="no-print"> Escribe los tuyos y el informe completo se recalcula.</span>
          </p>
          <CreditInputs report={report} calcs={yearCalcs} credit={credit} onChange={setChosen} />
          <h3 className="chapter-sub">Cómo se calcula</h3>
          <nav className="subtabs no-print" aria-label="Cálculos de crédito">
            {creditCalcs.map((calc) => (
              <a
                key={calc.id}
                className="subtab"
                href={`#calc-${calc.id}`}
                aria-current={calc.id === creditOpen ? 'true' : undefined}
              >
                {calc.name}
              </a>
            ))}
          </nav>
          {creditCalcs.map((calc) => (
            <div key={calc.id} className="data-panel" hidden={calc.id !== creditOpen}>
              {block(calc)}
            </div>
          ))}
          <Disclosure label="Tabla de referencia por tasa y plazo">
            <CreditTable report={report} calcs={yearCalcs} credit={credit} />
          </Disclosure>
          <AutoCredit report={report} calcs={yearCalcs} />
        </section>

        <section data-view="datos" className="view chapter chapter-break" hidden={place.view !== 'datos'}>
          <h2 className="view-title">Datos obtenidos del SII</h2>
          <p className="chapter-lead">
            Las tablas tal como se capturaron. La columna “Se usa en” indica qué cálculos toman cada
            dato; la columna destacada es {formatAt(year)}.
          </p>
          <nav className="subtabs no-print" aria-label="Tablas del SII">
            {DATA_TABS.map((tab) => (
              <a
                key={tab.id}
                className="subtab"
                href={`#datos-${tab.id}`}
                aria-current={tab.id === place.dataTab ? 'true' : undefined}
              >
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
          <div className="data-panel" hidden={place.dataTab !== 'propiedades'}>
            <div className="stat-grid stat-grid-3">
              <StatTile label="Propiedades" value={String(summary.count)} mono />
              <StatTile label="Avalúo fiscal total" value={formatMoney(summary.avaluoTotal)} mono />
              <StatTile
                label="Enajenación total"
                value={summary.enajenacionClp === null ? '—' : formatMoney(summary.enajenacionClp)}
                mono
              />
              <StatTile
                label="Pago contado total"
                value={summary.pagoContadoClp === null ? '—' : formatMoney(summary.pagoContadoClp)}
                mono
              />
            </div>
            {summary.count > 0 && (
              <div className="chip-rows">
                <div>
                  <span className="chip-row-label">Destinos</span>
                  {summary.byDestino.map((item) => (
                    <span className="tag tag-neutral" key={item.name}>
                      {item.name} · {item.count}
                    </span>
                  ))}
                </div>
                <div>
                  <span className="chip-row-label">Comunas</span>
                  {summary.byComuna.map((item) => (
                    <span className="tag tag-idle" key={item.name}>
                      {item.name} · {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="used-in used-in-line">
              <span>Se usa en</span>
              {model.property.calcs.map((calc) => (
                <a key={calc.id} href={`#calc-${calc.id}`}>
                  {calc.name}
                </a>
              ))}
            </p>
            <PatrimonySection report={report} as="h3" />
          </div>
          <div className="data-panel" hidden={place.dataTab !== 'contribuyente'}>
            <ContribuyenteTables report={report} />
            <Timeline days={model.timeline} />
          </div>
          <div className="data-panel" hidden={place.dataTab !== 'fuentes'}>
            <CoverageSection report={report} consent={consent} as="h3" />
          </div>
        </section>

        <section data-view="pendientes" className="view chapter" hidden={place.view !== 'pendientes'}>
          <h2 className="view-title">Pendientes del método</h2>
          <p className="chapter-lead">
            Todo lo que este informe calcula con reglas por confirmar, y lo que aún no se puede
            calcular.<span className="no-print"> Cada nombre abre su cálculo.</span>
          </p>
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
              <h3 className="card-heading">Reglas y parámetros en uso</h3>
            </div>
            <ParametersTable report={report} />
          </div>
        </section>

        <section data-view="glosario" className="view chapter" hidden={place.view !== 'glosario'}>
          <h2 className="view-title">Glosario</h2>
          <Glossary />
        </section>
      </div>

      <footer className="report-foot">
        <p>
          Este informe es referencial y no constituye una decisión tributaria ni crediticia.{' '}
          {report.warnings.join(' ')}
        </p>
        <p>
          {report.taxpayer.name} · {report.taxpayer.rut} · datos capturados el{' '}
          {formatDate(report.taxpayer.capturedAt)} · reglas {report.method.release} ·{' '}
          {STATUSES.map((status) => statusLabel[status]).join(' / ')}
        </p>
      </footer>
    </div>
  )
}
