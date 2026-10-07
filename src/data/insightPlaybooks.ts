import {
  formatAt,
  formatDate,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  formatUf,
} from '../lib/format'
import { presentValue } from '../lib/icred'
import { reportAnchor } from '../lib/routes'
import type {
  Cite,
  FinancialYear,
  PlanStep,
  Proposal,
  Report,
  ThreadTable,
} from '../types'

// Guiones del agente por hallazgo. Las cifras se calculan desde el reporte para
// que las respuestas no se desalineen de las tablas; el texto es fijo (demo).

export interface Ctx {
  report: Report
  first: FinancialYear
  last: FinancialYear
}

export interface Answer {
  text: string
  cites?: Cite[]
  table?: ThreadTable
  proposal?: Proposal
}

export interface Question {
  id: string
  label: string
  // Palabras que la reconocen cuando el usuario escribe libremente.
  keywords: string[]
  // Fuentes que el agente cruza para responder.
  tools: string[]
  simulation?: boolean
  answer: (ctx: Ctx) => Answer
}

export interface Evidence {
  source: string
  label: string
  value: string
  anchor: string
}

export interface UseCase {
  id: string
  title: string
  persona: string
  // Preguntas que se reproducen en orden.
  steps: string[]
}

export interface Origin {
  summary: string
  steps: PlanStep[]
  evidence: Evidence[]
  formula?: string
  // Qué parte del hallazgo depende de parámetros aún no validados.
  pending?: string
}

export interface Playbook {
  origin: (ctx: Ctx) => Origin
  questions: Question[]
  useCases: UseCase[]
}

const code = (report: Report, key: string) =>
  report.incomeOrigins.find((item) => item.code === key)?.values ?? {}

const signed = (value: number) => `${value >= 0 ? '+' : '−'}${formatMoney(Math.abs(value))}`

const CITE = {
  origenes: { label: 'Orígenes de renta', anchor: 'origenes' },
  base: { label: 'Base imponible IGC', anchor: 'base' },
  financiero: { label: 'Análisis financiero', anchor: 'financiero' },
  credito: { label: 'Capacidad de crédito', anchor: 'credito' },
  contingencias: { label: 'Contingencias', anchor: 'contingencias' },
  actividades: { label: 'Actividades económicas', anchor: 'actividades' },
  f29: { label: 'F29 y F50', anchor: 'f29' },
  fuentes: { label: 'Fuentes y cobertura', anchor: 'fuentes' },
} satisfies Record<string, Cite>

const reviewProposal: Proposal = {
  tag: 'Siguiente paso',
  text: 'Esto requiere criterio profesional. Puedo dejar el hallazgo marcado para que lo revise un analista.',
  label: 'Marcar para revisión',
  action: { kind: 'review' },
}

function mortgageRow(label: string, rfnMonthly: number, ctx: Ctx) {
  const { method } = ctx.report
  const pmt = Math.round(rfnMonthly * method.mortgageFactor)
  const pv = presentValue(pmt, method.mortgageRate, method.mortgageYears * 12)
  return [label, formatNumber(Math.round(rfnMonthly)), formatNumber(pmt), formatUf(pv / method.uf.value)]
}

export const playbooks: Record<string, Playbook> = {
  ingresos: {
    origin: ({ report, first, last }) => ({
      summary: `Sumé los 14 códigos de orígenes de renta de cada F22 y comparé los extremos: ${formatMoney(first.totalOrigins)} en ${formatAt(first.year)} contra ${formatMoney(last.totalOrigins)} en ${formatAt(last.year)}.`,
      formula: 'Total orígenes de renta = suma de los 14 códigos del F22',
      steps: [
        {
          id: 'o1',
          title: 'Leer los orígenes de renta de cada F22',
          detail: `${report.years.length} declaraciones vigentes, ${report.incomeOrigins.length} códigos por año.`,
          tools: ['F22'],
        },
        {
          id: 'o2',
          title: 'Sumar el total por año tributario',
          detail: report.financial
            .map((item) => `${formatAt(item.year)}: ${formatMoney(item.totalOrigins)}`)
            .join(' · '),
          tools: ['Cálculo'],
        },
        {
          id: 'o3',
          title: 'Comparar el último año con el primero',
          detail: `${formatDecimal(last.totalOrigins / first.totalOrigins)} veces el total de ${formatAt(first.year)}.`,
          tools: ['Comparación'],
        },
      ],
      evidence: [
        {
          source: 'F22',
          label: `Total orígenes ${formatAt(first.year)}`,
          value: formatMoney(first.totalOrigins),
          anchor: 'origenes',
        },
        {
          source: 'F22',
          label: `Total orígenes ${formatAt(last.year)}`,
          value: formatMoney(last.totalOrigins),
          anchor: 'origenes',
        },
        {
          source: 'F22 · 161',
          label: `Sueldos y salarios ${formatAt(last.year)}`,
          value: formatMoney(code(report, '161')[last.year] ?? 0),
          anchor: 'origenes',
        },
      ],
    }),
    questions: [
      {
        id: 'explica',
        label: '¿Qué explica el aumento?',
        keywords: ['explica', 'aumento', 'subio', 'crecio', 'por que', 'duplic'],
        tools: ['F22 · orígenes'],
        answer: ({ report, first, last }) => {
          const deltas = report.incomeOrigins
            .map((item) => ({
              ...item,
              from: item.values[first.year] ?? 0,
              to: item.values[last.year] ?? 0,
            }))
            .map((item) => ({ ...item, delta: item.to - item.from }))
            .filter((item) => item.delta !== 0)
            .toSorted((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          const up = deltas.filter((item) => item.delta > 0).slice(0, 2)
          const down = deltas.filter((item) => item.delta < 0).slice(0, 1)
          return {
            text: `El total creció ${signed(last.totalOrigins - first.totalOrigins)}. Lo explican sobre todo ${up.map((item) => `**${item.label.toLowerCase()}** (${signed(item.delta)})`).join(' y ')}.${down.length ? ` En contra juega **${down[0].label.toLowerCase()}** (${signed(down[0].delta)}).` : ''}`,
            table: {
              head: ['Origen', 'Código', formatAt(first.year), formatAt(last.year), 'Variación'],
              rows: deltas.map((item) => [
                item.label,
                item.code,
                formatNumber(item.from),
                formatNumber(item.to),
                signed(item.delta),
              ]),
            },
            cites: [CITE.origenes],
          }
        },
      },
      {
        id: 'flujo',
        label: '¿Todo ese ingreso es flujo real?',
        keywords: ['flujo', 'real', 'nominal', 'presunta', 'rechazado'],
        tools: ['F22 · 106 y 108', 'Método ICRED'],
        answer: ({ report, last }) => {
          const nominal = (code(report, '106')[last.year] ?? 0) + (code(report, '108')[last.year] ?? 0)
          return {
            text:
              nominal === 0
                ? `El método separa la **renta financiera** (flujo efectivo) de la **renta nominal** (gastos rechazados y rentas presuntas, códigos 106 y 108). En este caso ambos códigos están en cero, así que no hay rentas nominales que depurar. Aun así, el total no es tu renta personal: el método excluye arriendos y rentas exentas al calcular la renta financiera.`
                : `No todo. Hay ${formatMoney(nominal)} en rentas nominales (códigos 106 y 108) que forman parte de la base tributaria pero no son flujo de dinero.`,
            cites: [CITE.origenes, CITE.financiero],
            proposal: {
              tag: 'Relacionado',
              text: 'El hallazgo de renta financiera neta muestra cuánto de ese total cuenta como ingreso personal.',
              label: 'Abrir ese hallazgo',
              action: { kind: 'link', to: '/analisis/hallazgo/rfn' },
            },
          }
        },
      },
      {
        id: 'vs-rfb',
        label: '¿Cuánto de eso es renta financiera?',
        keywords: ['renta financiera', 'rfb', 'rfn', 'cuanto'],
        tools: ['Análisis financiero'],
        answer: ({ last }) => ({
          text: `De los ${formatMoney(last.totalOrigins)} de ${formatAt(last.year)}, la renta financiera bruta es ${formatMoney(last.rfb)} y la neta ${formatMoney(last.rfn)}. La diferencia con el total corresponde a los códigos que el método excluye (arriendos y rentas exentas).`,
          cites: [CITE.financiero],
        }),
      },
    ],
    useCases: [
      {
        id: 'comite',
        title: 'Explicar el crecimiento al comité',
        persona: 'Analista de riesgo',
        steps: ['explica', 'vs-rfb'],
      },
    ],
  },

  arriendos: {
    origin: ({ report, last }) => {
      const rents = code(report, '955')
      const current = rents[last.year] ?? 0
      return {
        summary: `Tomé el código 955 de ${formatAt(last.year)} (${formatMoney(current)}) y lo dividí por el total de orígenes de renta: ${formatRate(current / last.totalOrigins, 0)}.`,
        formula: 'Participación = código 955 / total orígenes de renta',
        steps: [
          {
            id: 'a1',
            title: 'Leer el código 955 en cada F22',
            detail: report.years.map((year) => `${formatAt(year)}: ${formatMoney(rents[year] ?? 0)}`).join(' · '),
            tools: ['F22 · 955'],
          },
          {
            id: 'a2',
            title: 'Calcular su peso en el total',
            detail: `${formatMoney(current)} sobre ${formatMoney(last.totalOrigins)}.`,
            tools: ['Cálculo'],
          },
          {
            id: 'a3',
            title: 'Aplicar el criterio del método',
            detail: 'Los arriendos no entran en la renta financiera personal.',
            tools: ['Método ICRED'],
          },
        ],
        evidence: [
          { source: 'F22 · 955', label: `Arriendos ${formatAt(last.year)}`, value: formatMoney(current), anchor: 'origenes' },
          { source: 'F22', label: `Total orígenes ${formatAt(last.year)}`, value: formatMoney(last.totalOrigins), anchor: 'origenes' },
        ],
        pending: 'Los códigos excluidos de la renta financiera (955 y 152) están pendientes de validación.',
      }
    },
    questions: [
      {
        id: 'por-que-excluye',
        label: '¿Por qué el método no los cuenta como renta personal?',
        keywords: ['por que', 'excluye', 'cuenta', 'renta personal', 'personal'],
        tools: ['Método ICRED'],
        answer: () => ({
          text: 'Porque miden cosas distintas. La **capacidad personal** es lo que puedes pagar con tus ingresos propios. Los arriendos, en cambio, son el flujo que sirve la deuda hipotecaria de las mismas propiedades: el método los trata con el **factor leverage**, no como sueldo. Sumarlos a tu renta personal contaría dos veces el mismo flujo.',
          cites: [CITE.financiero, CITE.credito],
        }),
      },
      {
        id: 'sim-incluir',
        label: '¿Cómo cambiaría mi capacidad si se incluyeran?',
        keywords: ['incluy', 'sumar', 'si se', 'capacidad', 'simul'],
        tools: ['F22 · 955', 'Parámetros'],
        simulation: true,
        answer: (ctx) => {
          const { report, last } = ctx
          const factor = last.rfn / last.rfb
          const exentas = code(report, '152')[last.year] ?? 0
          const rfnWith = ((last.totalOrigins - exentas) * factor) / 12
          return {
            text: `Simulación sobre ${formatAt(last.year)}, manteniendo el factor de renta neta del año (${formatDecimal(factor, 2)}). Incluir los arriendos subiría el dividendo de referencia, pero el método no lo recomienda para medir capacidad personal.`,
            table: {
              head: ['Escenario', 'RFN mensual', 'Dividendo de referencia', 'Capacidad'],
              rows: [
                mortgageRow('Método (sin arriendos)', last.rfnMonthly, ctx),
                mortgageRow('Con arriendos', rfnWith, ctx),
              ],
            },
            cites: [CITE.financiero, CITE.credito],
          }
        },
      },
      {
        id: 'desde-cuando',
        label: '¿Desde cuándo aparecen?',
        keywords: ['desde', 'cuando', 'aparec', 'histor'],
        tools: ['F22 · 955'],
        answer: ({ report }) => {
          const rents = code(report, '955')
          const withRent = report.years.filter((year) => (rents[year] ?? 0) > 0)
          return {
            text:
              withRent.length === 0
                ? 'No hay arriendos declarados en los años capturados.'
                : `Aparecen por primera vez en ${formatAt(withRent[0])}. ${withRent.map((year) => `${formatAt(year)}: ${formatMoney(rents[year] ?? 0)}`).join(' · ')}.`,
            cites: [CITE.origenes],
          }
        },
      },
    ],
    useCases: [
      {
        id: 'cliente-arriendos',
        title: '“¿Por qué no me cuentan los arriendos?”',
        persona: 'Cliente',
        steps: ['por-que-excluye', 'sim-incluir'],
      },
    ],
  },

  subdeclaracion: {
    origin: ({ report, last }) => {
      const contingency = report.contingency
      const declared = code(report, '955')[last.year] ?? 0
      if (!contingency) {
        return {
          summary: 'Este análisis no trae una estimación de contingencias.',
          steps: [],
          evidence: [],
        }
      }
      return {
        summary: `Comparé lo que informaste que percibes por arriendos (${formatMoney(contingency.rentsReceivedMonthly)} al mes) con lo declarado en el código 955. La diferencia de ${formatAt(last.year)} es ${formatMoney(contingency.rentsShouldDeclare - declared)}.`,
        formula: 'Arriendos no declarados = arriendo mensual × 12 − código 955',
        steps: [
          {
            id: 's1',
            title: 'Leer el código 955 declarado',
            detail: `${formatAt(last.year)}: ${formatMoney(declared)}.`,
            tools: ['F22 · 955'],
          },
          {
            id: 's2',
            title: 'Anualizar el arriendo informado por el cliente',
            detail: `${formatMoney(contingency.rentsReceivedMonthly)} × 12 = ${formatMoney(contingency.rentsShouldDeclare)}.`,
            tools: ['Dato del cliente'],
          },
          {
            id: 's3',
            title: 'Recalcular la base imponible y el impuesto',
            detail: contingency.years
              .map((item) => `${formatAt(item.year)}: base ajustada ${formatMoney(item.baseAdjusted)}`)
              .join(' · '),
            tools: ['Tabla IGC'],
          },
          {
            id: 's4',
            title: 'Aplicar reajustes, intereses y multas',
            detail: `Art. 53 y 97 del Código Tributario, al ${formatDate(contingency.asOf)}: ${formatMoney(contingency.total)}.`,
            tools: ['Código Tributario'],
          },
        ],
        evidence: [
          { source: 'F22 · 955', label: `Arriendos declarados ${formatAt(last.year)}`, value: formatMoney(declared), anchor: 'origenes' },
          { source: 'Cliente', label: 'Arriendos percibidos al año', value: formatMoney(contingency.rentsShouldDeclare), anchor: 'contingencias' },
          { source: 'Cálculo', label: 'Contingencia total estimada', value: formatMoney(contingency.total), anchor: 'contingencias' },
        ],
        pending: 'El arriendo percibido lo informa el cliente, no el SII. La contingencia es una estimación que debe validar un especialista.',
      }
    },
    questions: [
      {
        id: 'calculo',
        label: '¿Cómo se calcula la contingencia?',
        keywords: ['calcul', 'como se', 'conting', 'multa', 'interes', 'desglos'],
        tools: ['Tabla IGC', 'Art. 53 y 97 CT'],
        answer: ({ report }) => {
          const contingency = report.contingency
          if (!contingency) return { text: 'Este análisis no trae una estimación de contingencias.' }
          const years = contingency.years
          const row = (label: string, pick: (index: number) => number) => [
            label,
            ...years.map((_, index) => formatNumber(pick(index))),
          ]
          return {
            text: `Por cada año se recalcula el impuesto con los arriendos completos, se descuenta lo ya pagado y al saldo se le suman reajuste, intereses de 1,5% mensual y multa. El total de ${years.map((item) => formatAt(item.year)).join(' y ')} es **${formatMoney(contingency.total)}**.`,
            table: {
              head: ['Concepto', ...years.map((item) => formatAt(item.year))],
              rows: [
                row('Diferencia de impuesto', (i) => years[i].taxDifference),
                row('IGC ya pagado', (i) => -years[i].igcPaid),
                row('Débito fiscal neto', (i) => years[i].netDebit),
                row('Corrección monetaria', (i) => years[i].monetaryCorrection),
                row('Intereses', (i) => years[i].interest),
                row('Multa', (i) => years[i].fine),
                row('Débito total', (i) => years[i].totalDebit),
              ],
            },
            cites: [CITE.contingencias],
          }
        },
      },
      {
        id: 'origen-dato',
        label: '¿De dónde sale el arriendo percibido?',
        keywords: ['de donde', 'percibido', 'dato', 'informa', 'fuente', '5.370'],
        tools: ['Dato del cliente', 'Fuentes'],
        answer: ({ report }) => ({
          text: `No viene del SII: es el monto que el cliente informó (${formatMoney(report.contingency?.rentsReceivedMonthly ?? 0)} al mes). Todo el cálculo depende de ese dato; si cambia, cambia la contingencia. Antes de actuar conviene respaldarlo con contratos de arriendo o cartolas.`,
          cites: [CITE.contingencias, CITE.fuentes],
          proposal: reviewProposal,
        }),
      },
      {
        id: 'opciones',
        label: '¿Qué opciones tengo?',
        keywords: ['opcion', 'que hago', 'hacer', 'solucion', 'rectific', 'propuesta'],
        tools: ['Método ICRED'],
        answer: ({ report }) => ({
          text: `El método propone esta secuencia: ${(report.contingency?.proposal ?? []).map((item, index) => `(${index + 1}) ${item}`).join(' ')}`,
          cites: [CITE.contingencias],
          proposal: reviewProposal,
        }),
      },
      {
        id: 'regimen',
        label: '¿Qué cambia si paso a Primera Categoría?',
        keywords: ['primera categoria', 'regimen', 'empresario', '14 a', 'cambi'],
        tools: ['Método ICRED'],
        answer: () => ({
          text: 'Como persona natural, los arriendos se suman completos a la base del Global Complementario y no traen créditos. Como **empresario individual** (Art. 14 letra A) puedes imputar gastos financieros sin límite, depreciación y demás gastos necesarios; por regla general eso genera pérdida tributaria. A cambio debes llevar contabilidad y declarar PPM mensual en el F29. No puedo cuantificarlo con los datos de esta captura.',
          cites: [CITE.actividades, CITE.f29],
          proposal: reviewProposal,
        }),
      },
    ],
    useCases: [
      {
        id: 'cliente-contingencia',
        title: 'Entender la contingencia y qué hacer',
        persona: 'Cliente',
        steps: ['calculo', 'opciones'],
      },
      {
        id: 'analista-valida',
        title: 'Validar el dato antes de rectificar',
        persona: 'Analista tributario',
        steps: ['origen-dato', 'regimen'],
      },
    ],
  },

  tasa: {
    origin: ({ report, first, last }) => ({
      summary: `Dividí el impuesto determinado (código 157) por la base imponible (código 170) de cada año: de ${formatRate(first.effectiveRate)} en ${formatAt(first.year)} a ${formatRate(last.effectiveRate)} en ${formatAt(last.year)}.`,
      formula: 'Tasa efectiva = código 157 / código 170',
      steps: [
        {
          id: 't1',
          title: 'Leer base imponible e impuesto determinado',
          detail: `${formatAt(last.year)}: base ${formatMoney(report.igcBase.base170[last.year] ?? 0)}, impuesto ${formatMoney(report.igcBase.tax157[last.year] ?? 0)}.`,
          tools: ['F22 · 170', 'F22 · 157'],
        },
        {
          id: 't2',
          title: 'Calcular la tasa efectiva por año',
          detail: report.financial.map((item) => `${formatAt(item.year)}: ${formatRate(item.effectiveRate)}`).join(' · '),
          tools: ['Cálculo'],
        },
        {
          id: 't3',
          title: 'Ubicar el tramo del Art. 55 bis',
          detail: report.financial
            .map((item) => `${formatAt(item.year)}: ${formatDecimal(item.bitUta)} UTA, tramo ${report.igcBase.bracket55bis[item.year] ?? '—'}`)
            .join(' · '),
          tools: ['UTA', 'Parámetros'],
        },
      ],
      evidence: [
        { source: 'F22 · 170', label: `Base imponible ${formatAt(last.year)}`, value: formatMoney(report.igcBase.base170[last.year] ?? 0), anchor: 'base' },
        { source: 'F22 · 157', label: `Impuesto determinado ${formatAt(last.year)}`, value: formatMoney(report.igcBase.tax157[last.year] ?? 0), anchor: 'base' },
        { source: 'Cálculo', label: `Tasa efectiva ${formatAt(last.year)}`, value: formatRate(last.effectiveRate), anchor: 'financiero' },
      ],
      pending: 'Los rangos del tramo Art. 55 bis y el valor de la UTA están pendientes de validación.',
    }),
    questions: [
      {
        id: 'por-que-subio',
        label: '¿Por qué subió la tasa?',
        keywords: ['por que', 'subio', 'aumento', 'tasa'],
        tools: ['F22 · 170 y 157'],
        answer: ({ report }) => ({
          text: 'Porque el impuesto es progresivo: al crecer la base imponible, cada peso adicional tributa en un tramo más alto. La base más que se duplicó y el impuesto se multiplicó varias veces.',
          table: {
            head: ['Año', 'Base imponible (170)', 'Impuesto (157)', 'Tasa efectiva'],
            rows: report.financial.map((item) => [
              formatAt(item.year),
              formatNumber(report.igcBase.base170[item.year] ?? 0),
              formatNumber(report.igcBase.tax157[item.year] ?? 0),
              formatRate(item.effectiveRate),
            ]),
          },
          cites: [CITE.base, CITE.financiero],
        }),
      },
      {
        id: 'tramo',
        label: '¿Qué es el tramo B del Art. 55 bis?',
        keywords: ['tramo', '55 bis', 'uta', 'que es'],
        tools: ['Parámetros', 'UTA'],
        answer: ({ report }) => ({
          text: `El método clasifica la base imponible, medida en UTA, en tramos del Art. 55 bis (la franquicia por intereses hipotecarios, código 750). En este caso: ${report.financial.map((item) => `${formatAt(item.year)} ${formatDecimal(item.bitUta)} UTA → tramo ${report.igcBase.bracket55bis[item.year] ?? '—'}`).join('; ')}. Los rangos exactos de cada tramo siguen **pendientes de validación**, así que no puedo decirte dónde está el límite.`,
          cites: [CITE.financiero],
        }),
      },
      {
        id: 'usar-170',
        label: '¿Puedo usar la base imponible como mi ingreso?',
        keywords: ['170', 'base imponible', 'usar', 'ingreso'],
        tools: ['Método ICRED'],
        answer: () => ({
          text: 'No. El método es explícito: **nunca** se usa el código 170 como base de ingresos. Por un lado no depura las rentas nominales; por otro, queda rebajado por las franquicias de los Art. 55 bis y 42 bis (códigos 750 y 765), lo que subvalúa tu ingreso financiero.',
          cites: [CITE.financiero],
        }),
      },
    ],
    useCases: [
      {
        id: 'cliente-tasa',
        title: '“¿Por qué pago más impuesto?”',
        persona: 'Cliente',
        steps: ['por-que-subio', 'tramo'],
      },
    ],
  },

  rfn: {
    origin: ({ report, last }) => {
      const factor = last.rfn / last.rfb
      return {
        summary: `Partí del total de orígenes, resté los códigos que el método excluye y apliqué el factor del año: ${formatMoney(last.rfb)} × ${formatDecimal(factor, 2)} = ${formatMoney(last.rfn)}, es decir ${formatMoney(last.rfnMonthly)} al mes.`,
        formula: 'RFN = (total orígenes − códigos excluidos) × factor RFN · RFN mensual = RFN / 12',
        steps: [
          {
            id: 'r1',
            title: 'Calcular la renta financiera bruta',
            detail: `${formatAt(last.year)}: total ${formatMoney(last.totalOrigins)} menos arriendos y rentas exentas = ${formatMoney(last.rfb)}.`,
            tools: ['F22 · orígenes', 'Parámetros'],
          },
          {
            id: 'r2',
            title: 'Aplicar el factor de renta neta',
            detail: report.financial
              .map((item) => `${formatAt(item.year)}: ${formatDecimal(item.rfn / item.rfb, 2)}`)
              .join(' · '),
            tools: ['Parámetros'],
          },
          {
            id: 'r3',
            title: 'Llevar a promedio mensual',
            detail: report.financial.map((item) => `${formatAt(item.year)}: ${formatMoney(item.rfnMonthly)}`).join(' · '),
            tools: ['Cálculo'],
          },
        ],
        evidence: [
          { source: 'Cálculo', label: `RFB ${formatAt(last.year)}`, value: formatMoney(last.rfb), anchor: 'financiero' },
          { source: 'Cálculo', label: `RFN ${formatAt(last.year)}`, value: formatMoney(last.rfn), anchor: 'financiero' },
          { source: 'Cálculo', label: 'RFN mensual', value: formatMoney(last.rfnMonthly), anchor: 'financiero' },
        ],
        pending: 'El factor RFN y los códigos excluidos están pendientes de validación.',
      }
    },
    questions: [
      {
        id: 'factor',
        label: '¿Por qué cambió el factor en el último año?',
        keywords: ['factor', 'cambio', '0,80', '0,90', 'por que'],
        tools: ['Parámetros'],
        answer: ({ report }) => ({
          text: `No lo sé todavía, y prefiero decirlo así. El factor es ${report.financial.map((item) => `${formatDecimal(item.rfn / item.rfb, 2)} en ${formatAt(item.year)}`).join(', ')}: son los valores que reproducen la tabla del caso, pero la **regla que los define está pendiente** de validación con el autor del método.`,
          cites: [CITE.financiero],
          proposal: {
            tag: 'Simulación',
            text: 'Puedo mostrarte cómo quedaría la capacidad si el factor se hubiera mantenido.',
            label: 'Simular con el factor anterior',
            action: { kind: 'ask', questionId: 'sim-factor' },
          },
        }),
      },
      {
        id: 'sim-factor',
        label: '¿Y si el factor se hubiera mantenido?',
        keywords: ['mantenido', 'mismo factor', 'si el factor', 'simul'],
        tools: ['Parámetros', 'Cálculo'],
        simulation: true,
        answer: (ctx) => {
          const { report, last } = ctx
          const previous = report.financial.at(-2)
          if (!previous) return { text: 'No hay un año anterior para comparar el factor.' }
          const factor = previous.rfn / previous.rfb
          return {
            text: `Simulación: aplicar a ${formatAt(last.year)} el factor de ${formatAt(previous.year)} (${formatDecimal(factor, 2)}).`,
            table: {
              head: ['Escenario', 'RFN mensual', 'Dividendo de referencia', 'Capacidad'],
              rows: [
                mortgageRow(`Factor ${formatDecimal(last.rfn / last.rfb, 2)} (actual)`, last.rfnMonthly, ctx),
                mortgageRow(`Factor ${formatDecimal(factor, 2)}`, (last.rfb * factor) / 12, ctx),
              ],
            },
            cites: [CITE.financiero, CITE.credito],
          }
        },
      },
      {
        id: 'gif',
        label: '¿Cómo se relaciona con el GIF y el IFN del método?',
        keywords: ['gif', 'ifn', '158', '494', 'metodo'],
        tools: ['Método ICRED', 'F22 · 158 y 494'],
        answer: ({ report }) => ({
          text: `El Capítulo IV define el camino completo así: ${report.method.reference.slice(0, 3).join(' · ')}. Esta captura no trae los códigos 158 ni 494, por eso el análisis usa la tabla del caso (RFB y RFN) y no puedo recalcular GIF ni IFN.`,
          cites: [CITE.financiero],
        }),
      },
    ],
    useCases: [
      {
        id: 'analista-factor',
        title: 'Cuestionar el factor de renta neta',
        persona: 'Analista de riesgo',
        steps: ['factor', 'sim-factor'],
      },
    ],
  },

  hipotecario: {
    origin: (ctx) => {
      const { report, last } = ctx
      const { method } = report
      const pv = presentValue(last.mortgageLimit, method.mortgageRate, method.mortgageYears * 12)
      return {
        summary: `Tomé el ${formatRate(method.mortgageFactor, 0)} de tu renta financiera neta mensual (${formatMoney(last.rfnMonthly)}) como dividendo de referencia y lo llevé a valor presente a ${method.mortgageYears} años y ${formatRate(method.mortgageRate, 0)} anual.`,
        formula: 'Dividendo = RFN mensual × 0,25 · Capacidad = PMT × (1 − (1 + i)^−n) / i',
        steps: [
          {
            id: 'h1',
            title: 'Tomar la renta financiera neta mensual',
            detail: `${formatAt(last.year)}: ${formatMoney(last.rfnMonthly)}.`,
            tools: ['Análisis financiero'],
          },
          {
            id: 'h2',
            title: 'Aplicar el factor hipotecario',
            detail: `${formatMoney(last.rfnMonthly)} × ${formatDecimal(method.mortgageFactor, 2)} = ${formatMoney(last.mortgageLimit)}.`,
            tools: ['Parámetros'],
          },
          {
            id: 'h3',
            title: 'Calcular la capacidad de endeudamiento',
            detail: `${formatMoney(Math.round(pv))}, equivalente a ${formatUf(pv / method.uf.value)}.`,
            tools: ['Valor presente', 'UF'],
          },
        ],
        evidence: [
          { source: 'Cálculo', label: 'RFN mensual', value: formatMoney(last.rfnMonthly), anchor: 'financiero' },
          { source: 'Cálculo', label: 'Dividendo de referencia', value: formatMoney(last.mortgageLimit), anchor: 'financiero' },
          { source: 'Simulación', label: 'Capacidad de endeudamiento', value: formatUf(pv / method.uf.value), anchor: 'credito' },
        ],
        pending: 'Depende de la renta financiera neta, cuyos parámetros están pendientes. Es un valor referencial, no una aprobación de crédito.',
      }
    },
    questions: [
      {
        id: 'sim-tasa',
        label: '¿Y si la tasa sube a 5%?',
        keywords: ['tasa', '5%', 'sube', 'interes'],
        tools: ['Valor presente'],
        simulation: true,
        answer: ({ report, last }) => {
          const { method } = report
          const months = method.mortgageYears * 12
          const row = (rate: number) => {
            const pv = presentValue(last.mortgageLimit, rate, months)
            return [formatRate(rate, 0), formatNumber(Math.round(pv)), formatUf(pv / method.uf.value)]
          }
          const base = presentValue(last.mortgageLimit, method.mortgageRate, months)
          const higher = presentValue(last.mortgageLimit, 0.05, months)
          return {
            text: `Con el mismo dividendo de ${formatMoney(last.mortgageLimit)} a ${method.mortgageYears} años, un punto más de tasa reduce tu capacidad en ${formatRate(1 - higher / base, 0)}.`,
            table: {
              head: ['Tasa anual', 'Capacidad ($)', 'Capacidad (UF)'],
              rows: [row(method.mortgageRate), row(0.05), row(0.06)],
            },
            cites: [CITE.credito],
          }
        },
      },
      {
        id: 'sim-plazo',
        label: '¿Y si el crédito es a 20 años?',
        keywords: ['20 anos', 'plazo', 'anos', 'menos plazo'],
        tools: ['Valor presente'],
        simulation: true,
        answer: ({ report, last }) => {
          const { method } = report
          const row = (years: number) => {
            const pv = presentValue(last.mortgageLimit, method.mortgageRate, years * 12)
            return [`${years} años`, formatNumber(Math.round(pv)), formatUf(pv / method.uf.value)]
          }
          return {
            text: `Con el mismo dividendo y ${formatRate(method.mortgageRate, 0)} anual, acortar el plazo baja el monto que puedes financiar.`,
            table: {
              head: ['Plazo', 'Capacidad ($)', 'Capacidad (UF)'],
              rows: [row(method.mortgageYears), row(25), row(20)],
            },
            cites: [CITE.credito],
            proposal: {
              tag: 'Simulador',
              text: 'En el Diagnóstico Base puedes probar cualquier combinación de tasa y plazo.',
              label: 'Abrir el simulador',
              action: { kind: 'link', to: reportAnchor('credito') },
            },
          }
        },
      },
      {
        id: 'leverage',
        label: '¿Qué es el factor leverage?',
        keywords: ['leverage', 'apalanc', 'veces', 'inversion'],
        tools: ['Método ICRED', 'Valor presente'],
        answer: ({ report, last }) => {
          const { method } = report
          const pv = presentValue(last.mortgageLimit, method.mortgageRate, method.mortgageYears * 12)
          return {
            text: 'Tu capacidad personal mide lo que puedes pagar con tus ingresos propios. El **factor leverage** es cuántas veces ese monto está dispuesta a financiar una institución a un inversionista inmobiliario, porque ahí el servicio de la deuda viene de los arriendos. Lo define cada institución según tu experiencia administrando deuda.',
            table: {
              head: ['Factor', 'Deuda máxima (UF)'],
              rows: [1, 2, 3].map((factor) => [`Factor ${factor}`, formatUf((pv * factor) / method.uf.value)]),
            },
            cites: [CITE.credito],
          }
        },
      },
      {
        id: 'automotriz',
        label: '¿Cuánto podría pedir para un crédito automotriz?',
        keywords: ['automotriz', 'auto', 'vehiculo'],
        tools: ['Parámetros'],
        answer: ({ report, last }) => {
          const { method } = report
          return {
            text: `Para un automotriz el método usa el ${formatRate(method.autoFactor, 0)} de tu renta financiera neta mensual: una cuota de referencia de **${formatMoney(Math.round(last.rfnMonthly * method.autoFactor))}** a ${method.autoMonths} meses. El monto que eso financia depende de la tasa, que el método no fija.`,
            cites: [CITE.financiero],
            proposal: {
              tag: 'Simulador',
              text: 'Ingresa una tasa automotriz en el simulador para ver el monto.',
              label: 'Abrir el simulador',
              action: { kind: 'link', to: reportAnchor('credito') },
            },
          }
        },
      },
    ],
    useCases: [
      {
        id: 'cliente-hipotecario',
        title: 'Evaluar un crédito hipotecario',
        persona: 'Cliente',
        steps: ['sim-tasa', 'sim-plazo'],
      },
      {
        id: 'inversionista',
        title: 'Crecer como inversionista inmobiliario',
        persona: 'Ejecutivo de crédito',
        steps: ['leverage', 'sim-tasa'],
      },
    ],
  },

  'actividad-arriendos': {
    origin: ({ report }) => {
      const activity = report.activities.find((item) => item.code === '681012')
      return {
        summary: activity
          ? `En el registro de actividades económicas del SII aparece el código ${activity.code} con inicio el ${formatDate(activity.startDate)}. Lo crucé con los años en que ya había arriendos declarados.`
          : 'No encontré la actividad de arriendo de inmuebles en el registro del SII.',
        steps: [
          {
            id: 'c1',
            title: 'Leer las actividades económicas vigentes',
            detail: report.activities.map((item) => `${item.code} desde ${formatDate(item.startDate)}`).join(' · '),
            tools: ['SII · actividades'],
          },
          {
            id: 'c2',
            title: 'Cruzar con los arriendos declarados',
            detail: report.years
              .filter((year) => (code(report, '955')[year] ?? 0) > 0)
              .map((year) => `${formatAt(year)}: ${formatMoney(code(report, '955')[year] ?? 0)}`)
              .join(' · '),
            tools: ['F22 · 955'],
          },
          {
            id: 'c3',
            title: 'Revisar las declaraciones mensuales posteriores',
            detail: `${report.f29.length} períodos de F29 desde el inicio de actividades.`,
            tools: ['F29'],
          },
        ],
        evidence: [
          { source: 'SII', label: 'Inicio actividad 681012', value: activity ? formatDate(activity.startDate) : '—', anchor: 'actividades' },
          { source: 'F29', label: 'Períodos declarados', value: String(report.f29.length), anchor: 'f29' },
        ],
      }
    },
    questions: [
      {
        id: 'implica',
        label: '¿Qué implica haber iniciado actividades?',
        keywords: ['implica', 'inicio', 'actividad', 'obliga'],
        tools: ['Método ICRED', 'F29'],
        answer: ({ report }) => ({
          text: `Desde el inicio de actividades corresponde declarar el F29 todos los meses, aunque no haya movimiento. En esta captura hay ${report.f29.length} períodos, todos declarados sin movimiento. Si además cambias a Primera Categoría como empresario individual, se suma el PPM mensual y la contabilidad completa.`,
          cites: [CITE.actividades, CITE.f29],
        }),
      },
      {
        id: 'sin-f29',
        label: '¿Por qué faltan períodos de F29?',
        keywords: ['faltan', 'falta', 'f29', 'periodo', 'antes'],
        tools: ['Fuentes'],
        answer: ({ report }) => {
          const coverage = report.taxpayer.sources.find((item) => item.source === 'F29')
          return {
            text: coverage
              ? `No es un error de la captura. ${coverage.note} Obtenido: ${coverage.obtained.join(', ') || '—'}. Faltante: ${coverage.missing.join(', ') || '—'}.`
              : 'Esta captura no trae información de cobertura del F29.',
            cites: [CITE.fuentes, CITE.f29],
          }
        },
      },
    ],
    useCases: [
      {
        id: 'cliente-actividades',
        title: 'Entender las obligaciones mensuales',
        persona: 'Cliente',
        steps: ['implica', 'sin-f29'],
      },
    ],
  },
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

// Reconoce la pregunta con guion que mejor calza con un texto libre.
export function matchQuestion(playbook: Playbook, text: string): Question | null {
  const input = normalize(text)
  let best: Question | null = null
  let bestScore = 0
  for (const question of playbook.questions) {
    const score = question.keywords.filter((keyword) => input.includes(normalize(keyword))).length
    if (score > bestScore) {
      best = question
      bestScore = score
    }
  }
  return best
}

export function thinkingSteps(tools: string[]): PlanStep[] {
  return [
    { id: 'k1', title: 'Leer tu pregunta', tools: ['Agente'] },
    { id: 'k2', title: 'Cruzar con los datos del análisis', tools },
    { id: 'k3', title: 'Responder con respaldo', tools: ['Citas'] },
  ]
}
