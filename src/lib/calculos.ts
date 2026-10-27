import type { Report, UtaRange } from '../types'
import {
  formatAt,
  formatDate,
  formatDecimal,
  formatExact,
  formatMoney,
  formatRate,
  formatRateExact,
  formatUf,
} from './format'
import { presentValue } from './finanzas'
import { formatMeses, plazoCredito, sumKnown, summarizeProperties, type PatrimonySummary } from './patrimonio'

// Registro único de cálculos del Diagnóstico Base.
//
// Reglas de este archivo, para que el informe sea idéntico con las mismas cifras:
// - Cada cálculo tiene una pregunta, un nombre, una definición y una plantilla de
//   frase "en simple". Son textos fijos: entre personas solo cambian las cifras.
// - No hay frases que evalúen, comparen años o dependan del caso.
// - Los casos especiales usan las frases cerradas de FIXED.
// - La ecuación declara de dónde sale cada número; el mapa, los enlaces y la marca
//   "se usa en" de las tablas del SII se generan desde aquí.

export type CalcStatus = 'calculado' | 'por_confirmar' | 'por_determinar'
export type CalcState = 'ok' | 'no_aplica' | 'sin_dato'
export type OperandKind = 'sii' | 'param' | 'calc'
export type Op = '+' | '−' | '×' | '÷'
export type SiiTable = 'origenes' | 'rebajas' | 'base' | 'ajustes' | 'patrimonio'

export interface Operand {
  kind: OperandKind
  label: string
  value: number | null
  display: string
  // De dónde viene: formulario, código y año; valor de referencia; u otro cálculo.
  source: string
  // Sección del informe donde está el dato (kind 'sii') o cálculo que lo produce.
  table?: SiiTable
  code?: string
  // Fila de la tabla de origen (el código, o un identificador si no tiene código).
  row?: string
  calcId?: string
}

export type Equation =
  | {
      kind: 'arith'
      terms: { op: Op | null; operand: Operand }[]
      zeros: number
      // Nombres de los conceptos en cero que no se dibujan.
      omitted?: string[]
      result: string
    }
  | { kind: 'formula'; formula: string; operands: Operand[]; result: string }
  | { kind: 'ranges'; input: Operand; ranges: { label: string; range: string; current: boolean }[] }
  | { kind: 'multiples'; base: Operand; rows: { label: string; result: string }[] }
  | { kind: 'parts'; rows: { operand: Operand; note: string }[]; total: string }

export interface Calc {
  id: string
  question: string
  name: string
  definition: string
  status: CalcStatus
  // Qué falta confirmar o determinar. Texto fijo.
  statusNote: string | null
  state: CalcState
  value: number | null
  display: string
  plain: string
  equation: Equation | null
  // Diferencia entre el valor informado por el sistema y esta operación.
  check: string | null
  dependsOn: string[]
}

export interface PendingItem {
  id: string
  name: string
  definition: string
  inputs: Operand[]
  missing: string
}

export const statusLabel: Record<CalcStatus, string> = {
  calculado: 'Calculado',
  por_confirmar: 'Por confirmar',
  por_determinar: 'Por determinar',
}

export const kindLabel: Record<OperandKind, string> = {
  sii: 'Dato del SII',
  param: 'Valor de referencia',
  calc: 'Resultado calculado',
}

export const FIXED = {
  noData: 'Dato no capturado.',
  noYear: 'Sin declaración ese año.',
  noProperties: 'Sin propiedades inscritas.',
  divZero: (what: string) => `No se puede calcular: ${what} es 0.`,
  mismatch: (reported: string, diff: string) =>
    `El valor informado por el sistema es ${reported}; difiere en ${diff} del resultado de esta operación.`,
}

// ---------- Textos fijos de la interfaz ----------
// Iguales para cualquier persona: hablan del dato y de su origen, nunca del caso.

type Method = Report['method']

// Qué significa cada estado, en palabras de quien lee el informe.
export const statusHelp: Record<CalcStatus, string> = {
  calculado: 'La operación y todos sus datos están completos.',
  por_confirmar: 'Falta confirmar un dato o un supuesto de este cálculo.',
  por_determinar: 'Falta un dato o la forma de calcularlo. Se muestra lo que ya se tiene.',
}

// Qué es cada tipo de dato de una operación.
export const kindHelp: Record<OperandKind, string> = {
  sii: 'Lo declarado o registrado en el SII, con su formulario, código y año.',
  param: 'Un valor fijo, igual para todas las personas, como los 12 meses del año o la UF.',
  calc: 'El resultado de otro cálculo de este informe.',
}

export const CREDIT_HELP = (method: Method) =>
  `No hay una tasa ni un plazo únicos: cada institución define los suyos. El informe parte con una tasa de referencia de ${formatRateExact(method.mortgageRate)} anual a ${method.mortgageYears} años.`

// Plazo del crédito de cada propiedad. El SII registra el plazo pactado, no los pagos.
export const PLAZO_TEXT = {
  name: 'Plazo transcurrido del crédito',
  definition:
    'El tiempo desde la fecha de la escritura hasta la fecha de captura, contado sobre el plazo pactado del crédito de cada propiedad.',
  status: 'por_confirmar' as CalcStatus,
  statusNote:
    'El SII registra el plazo pactado, no los dividendos pagados: se supone que los pagos están al día.',
  plain: (transcurrido: string, pactado: string, restante: string) =>
    `Desde la escritura han pasado ${transcurrido} de un plazo pactado de ${pactado}; quedan ${restante}.`,
  sinPlazo: 'Plazo no informado en la escritura.',
  sinCredito: 'Sin crédito',
  question: '¿Cuánto del plazo pactado ha transcurrido en cada crédito?',
  formula: 'Fecha de captura − fecha de escritura, sin pasar del plazo pactado',
  source: (escritura: string, pactado: string) =>
    `SII · Mis Bienes · escritura del ${escritura}, plazo pactado de ${pactado}`,
  // Frase del cálculo para todo el grupo de propiedades con crédito.
  todas: (count: number, captura: string) =>
    `Para ${count === 1 ? 'la propiedad' : `cada una de las ${count} propiedades`} con crédito se cuenta el tiempo desde la escritura hasta la captura del ${captura}.`,
  ninguna: 'Ninguna propiedad tiene crédito.',
  // Fila de la lista: "7 años y 3 meses de 25 años".
  of: (transcurrido: string, pactado: string) => `${transcurrido} de ${pactado}`,
  left: (restante: string) => `Quedan ${restante}`,
}

// Qué muestra cada columna de la lista de propiedades.
export const PROPERTY_COLUMNS: { key: string; label: string; help: string }[] = [
  { key: 'propiedad', label: 'Comuna y destino', help: 'Dónde está la propiedad y para qué está inscrita: habitacional, sitio eriazo u otro destino.' },
  { key: 'compra', label: 'Compra', help: 'El año de la escritura de compra.' },
  { key: 'institucion', label: 'Institución', help: 'Quién financió la compra. “Ninguna” si se pagó todo al contado.' },
  {
    key: 'plazo',
    label: 'Plazo transcurrido',
    help: 'El tiempo desde la escritura hasta la fecha de captura, sobre el plazo pactado del crédito. La barra muestra la parte transcurrida.',
  },
  {
    key: 'financiado',
    label: 'Financiado',
    help: 'Lo que no se pagó al contado. En la barra, lo liso es lo pagado al contado y lo rayado, lo financiado.',
  },
  { key: 'precio', label: 'Precio', help: 'El monto de enajenación: lo que costó la propiedad, en UF.' },
]

// Actividades económicas: el dato tal como lo registra el SII, sin evaluarlo.
export const ACTIVITY_TEXT = {
  title: 'Actividades económicas registradas',
  source: 'SII · Datos del contribuyente',
  none: 'Sin actividades económicas registradas.',
  afectaIva: (value: boolean | null) => (value === null ? '—' : value ? 'Sí' : 'No'),
}

export const CREDIT_DISCLAIMER = 'Valores referenciales: no constituyen una oferta ni una aprobación de crédito.'

// De dónde salen la tasa y el plazo del Credit Capacity.
export function creditSource(method: Method, credit?: CreditChoice) {
  const rate = credit?.rate ?? method.mortgageRate
  const years = credit?.years ?? method.mortgageYears
  return rate === method.mortgageRate && years === method.mortgageYears
    ? 'Tasa y plazo de referencia'
    : 'Tasa y plazo escritos en este informe'
}

export const CREDIT_TERMS = (method: Method, credit: CreditChoice) =>
  `Con ${formatRateExact(credit.rate)} anual a ${formatExact(credit.years)} años · ${creditSource(method, credit)}`

const money = (value: number) => formatMoney(Math.round(value))
const uta = (value: number) => `${formatDecimal(value, 2)} UTA`
const ufAmount = (value: number) => `${formatDecimal(value, 2)} UF`
const factor = (value: number) => formatDecimal(value, 2)

const OPS: Record<Op, (a: number, b: number) => number> = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
}

// Resuelve una operación de izquierda a derecha. null si falta algún dato.
export function evaluate(terms: { op: Op | null; operand: Operand }[]): number | null {
  let acc: number | null = null
  for (const term of terms) {
    const value = term.operand.value
    if (value === null) return null
    acc = acc === null || term.op === null ? value : OPS[term.op](acc, value)
  }
  return acc
}

// Los rangos van en orden. El tope de un rango pertenece a ese rango solo si lo indica.
function findRange<T extends UtaRange>(ranges: T[], value: number): T | undefined {
  return ranges.find(
    (item) => item.toUta === null || value < item.toUta || (item.toInclusive === true && value === item.toUta),
  )
}

function rangeText(ranges: UtaRange[], index: number) {
  const item = ranges[index]
  const from = formatDecimal(item.fromUta, 1)
  const above = index > 0 && ranges[index - 1].toInclusive === true
  const start = above ? `Más de ${from}` : `Desde ${from}`
  if (item.toUta === null) return `${start} UTA`
  const to = formatDecimal(item.toUta, 1)
  if (index === 0) return `${item.toInclusive ? 'Hasta' : 'Menos de'} ${to} UTA`
  return `${start} y ${item.toInclusive ? 'hasta' : 'menos de'} ${to} UTA`
}

interface Built {
  equation: Equation | null
  value: number | null
}

// ---------- Cálculos por año tributario ----------

// Tasa anual y plazo en años que elige la persona para el Credit Capacity.
export interface CreditChoice {
  rate: number
  years: number
}

export function buildYearCalcs(report: Report, year: number, credit?: CreditChoice): Calc[] {
  const { method, igcBase } = report
  const fin = report.financial.find((item) => item.year === year)
  const declared = report.years.includes(year)
  const folio = report.f22Returns.find((item) => item.year === year)?.folio
  const f22 = (code: string | null) =>
    ['F22', code ? `código ${code}` : null, formatAt(year), folio ? `folio ${folio}` : null]
      .filter(Boolean)
      .join(' · ')

  const sii = (
    label: string,
    code: string | null,
    table: SiiTable,
    value: number | null,
    row: string | null = code,
  ): Operand => ({
    kind: 'sii',
    label,
    value,
    display: value === null ? '—' : money(value),
    source: f22(code),
    table,
    code: code ?? undefined,
    row: row ?? undefined,
  })
  const param = (label: string, value: number | null, display: string, source: string): Operand => ({
    kind: 'param',
    label,
    value,
    display,
    source,
  })
  const ref = (calc: Calc): Operand => ({
    kind: 'calc',
    label: calc.name,
    value: calc.value,
    display: calc.display,
    source: 'Calculado en este informe',
    calcId: calc.id,
  })

  // Regla del F22 compacto: en una declaración capturada, un código ausente vale 0.
  const fromF22 = (value: number | null | undefined) => (declared ? (value ?? 0) : null)
  const origin = (code: string) =>
    fromF22(report.incomeOrigins.find((item) => item.code === code)?.values[year])
  const adjustment = (code: string) =>
    fromF22(method.adjustments.find((item) => item.code === code)?.values[year])
  const originLabel = (code: string) =>
    report.incomeOrigins.find((item) => item.code === code)?.label ?? `Código ${code}`
  const adjustmentLabel = (code: string) =>
    method.adjustments.find((item) => item.code === code)?.label ?? `Código ${code}`

  const calcs: Calc[] = []
  const add = (
    base: Omit<Calc, 'state' | 'value' | 'display' | 'plain' | 'equation' | 'check' | 'dependsOn'>,
    built: Built,
    options: {
      format: (value: number) => string
      plain: (display: string) => string
      reported?: number | null
      tolerance?: number
      formatDiff?: (diff: number) => string
      zero?: string
    },
  ): Calc => {
    const reported = options.reported ?? null
    const value = reported ?? built.value
    let state: CalcState = 'ok'
    let plain: string
    let display = '—'
    if (!declared) {
      state = 'sin_dato'
      plain = FIXED.noYear
    } else if (options.zero) {
      state = 'no_aplica'
      plain = FIXED.divZero(options.zero)
    } else if (value === null) {
      state = 'sin_dato'
      plain = FIXED.noData
    } else {
      display = options.format(value)
      plain = options.plain(display)
    }
    let check: string | null = null
    if (state === 'ok' && reported !== null && built.value !== null) {
      const diff = Math.abs(reported - built.value)
      if (diff > (options.tolerance ?? 0)) {
        check = FIXED.mismatch(options.format(reported), (options.formatDiff ?? options.format)(diff))
      }
    }
    const equation = state === 'ok' ? built.equation : null
    const dependsOn =
      equation === null
        ? []
        : operandsOf(equation)
            .map((operand) => operand.calcId)
            .filter((id) => id !== undefined)
    const calc: Calc = { ...base, state, value: state === 'ok' ? value : null, display, plain, equation, check, dependsOn }
    calcs.push(calc)
    return calc
  }
  const arith = (
    terms: { op: Op | null; operand: Operand }[],
    format: (value: number) => string,
    zeros = 0,
    round = true,
  ): Built => {
    const raw = evaluate(terms)
    const value = raw === null ? null : round ? Math.round(raw) : raw
    return {
      value,
      equation: { kind: 'arith', terms, zeros, result: value === null ? '—' : format(value) },
    }
  }
  const sumOf = (
    rows: { label: string; code: string | null; row: string; value: number | null }[],
    table: SiiTable,
  ) => {
    const active = rows.filter((row) => row.value !== null && row.value !== 0)
    const terms = active.map((row, index) => ({
      op: index === 0 ? null : ('+' as Op),
      operand: sii(row.label, row.code, table, row.value, row.row),
    }))
    // Sin códigos distintos de cero, la suma es 0 (no "sin dato").
    if (declared && active.length === 0) {
      const equation: Equation = {
        kind: 'arith',
        terms: [],
        zeros: rows.length,
        omitted: rows.map((row) => row.label),
        result: money(0),
      }
      return { value: 0, equation }
    }
    const built = arith(terms, money, rows.length - active.length)
    if (built.equation?.kind === 'arith') {
      built.equation.omitted = rows.filter((row) => !active.includes(row)).map((row) => row.label)
    }
    return built
  }

  // 1. Total de orígenes de renta: ingresos brutos afectos sin las rentas nominales
  const total = add(
    {
      id: 'total-origenes',
      question: '¿Cuánto ingreso se declaró en el año?',
      name: 'Total de orígenes de renta',
      definition:
        'Los ingresos brutos afectos del año (código 158) sin las rentas nominales, que no son flujo de dinero: gastos rechazados (código 106) y rentas presuntas (código 108).',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: sii(adjustmentLabel('158'), '158', 'ajustes', adjustment('158')) },
        { op: '−', operand: sii(originLabel('106'), '106', 'origenes', origin('106')) },
        { op: '−', operand: sii(originLabel('108'), '108', 'origenes', origin('108')) },
      ],
      money,
    ),
    {
      format: money,
      plain: (display) =>
        `En la declaración de renta ${year}, los ingresos brutos afectos sin rentas nominales suman ${display}.`,
    },
  )

  // 2. Total de rebajas
  const rebajas = add(
    {
      id: 'total-rebajas',
      question: '¿Cuánto se rebajó de esas rentas?',
      name: 'Total de rebajas',
      definition:
        'Los montos que la ley permite descontar de las rentas antes de calcular el impuesto, como intereses hipotecarios o ahorro previsional voluntario.',
      status: 'calculado',
      statusNote: null,
    },
    sumOf(
      report.deductions.map((item) => ({
        label: item.label,
        code: item.code,
        row: item.id,
        value: fromF22(item.values[year]),
      })),
      'rebajas',
    ),
    {
      format: money,
      plain: (display) => `En la declaración de renta ${year} se rebajaron ${display}.`,
    },
  )

  // 3. Base imponible
  const base170 = declared ? (igcBase.base170[year] ?? null) : null
  const tax157 = declared ? (igcBase.tax157[year] ?? null) : null
  const base = add(
    {
      id: 'base-imponible',
      question: '¿Sobre qué monto se calcula el impuesto?',
      name: 'Base imponible',
      definition:
        'El monto sobre el que se aplica el impuesto anual. Corresponde al código 170 del Formulario 22.',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: ref(total) },
        { op: '−', operand: ref(rebajas) },
      ],
      money,
    ),
    {
      format: money,
      reported: base170,
      plain: (display) => `El impuesto de ${year} se calculó sobre una base de ${display}.`,
    },
  )

  // 4. Tasa efectiva
  const rate = add(
    {
      id: 'tasa-efectiva',
      question: '¿Qué porcentaje se paga de impuesto?',
      name: 'Tasa efectiva de tributación',
      definition: 'El impuesto del año dividido por la base imponible.',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: sii('Impuesto determinado', '157', 'base', tax157) },
        { op: '÷', operand: sii('Base imponible', '170', 'base', base170) },
      ],
      (value) => formatRate(value, 2),
      0,
      false,
    ),
    {
      format: (value) => formatRate(value, 2),
      reported: fin?.effectiveRate,
      tolerance: 0.0001,
      formatDiff: (diff) => `${formatDecimal(diff * 100, 2)} puntos`,
      zero: base170 === 0 ? 'la base imponible' : undefined,
      plain: (display) =>
        `De cada $100 de base imponible, $${display.replace('%', '')} corresponden a impuesto.`,
    },
  )

  // 5. Renta financiera bruta
  const rfb = add(
    {
      id: 'renta-bruta',
      question: '¿Cuánto es el ingreso financiero bruto?',
      name: 'Renta financiera bruta (RFB)',
      definition:
        'El total de orígenes de renta más el gasto presunto de honorarios (código 494). Ese código es mayor que cero solo si la persona emite boletas con gasto presunto: el SII ya le descontó 30% de sus honorarios, y aquí se suma para volver al ingreso real. Con gasto efectivo vale cero y no cambia nada.',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: ref(total) },
        { op: '+', operand: sii(adjustmentLabel('494'), '494', 'ajustes', adjustment('494')) },
      ],
      money,
    ),
    {
      format: money,
      plain: (display) =>
        `Al total de orígenes de ${total.display} se le suma el gasto presunto de honorarios: ${display}.`,
    },
  )

  // 6. Renta financiera neta: la bruta sin la parte que se va en impuesto
  const exactRate = base170 === null || tax157 === null || base170 === 0 ? null : tax157 / base170
  const rfnValue = rfb.value === null || exactRate === null ? null : Math.round(rfb.value * (1 - exactRate))
  const rfn = add(
    {
      id: 'renta-neta',
      question: '¿Cuánto queda como renta neta?',
      name: 'Renta financiera neta (RFN)',
      definition:
        'La renta financiera bruta sin la parte que se paga de impuesto: se multiplica por uno menos la tasa efectiva de tributación.',
      status: 'calculado',
      statusNote: null,
    },
    {
      value: rfnValue,
      equation: {
        kind: 'formula',
        formula: 'Renta financiera bruta × (1 − tasa efectiva de tributación)',
        operands: [ref(rfb), ref(rate)],
        result: rfnValue === null ? '—' : money(rfnValue),
      },
    },
    {
      format: money,
      zero: base170 === 0 ? 'la base imponible' : undefined,
      plain: (display) =>
        `A la renta financiera bruta de ${rfb.display} se le descuenta la tasa efectiva de ${rate.display}: quedan ${display}.`,
    },
  )

  // 7. RFN mensual
  const monthly = add(
    {
      id: 'rfn-mensual',
      question: '¿Cuánta renta neta queda al mes?',
      name: 'Renta financiera neta mensual',
      definition: 'La renta financiera neta del año dividida en 12 meses.',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: ref(rfn) },
        { op: '÷', operand: param('Meses del año', 12, '12', 'Constante') },
      ],
      money,
    ),
    {
      format: money,
      tolerance: 1,
      plain: (display) => `La renta financiera neta de ${rfn.display} al año equivale a ${display} al mes.`,
    },
  )

  // 8 y 9. Límites de crédito
  const share = (
    id: string,
    question: string,
    name: string,
    definition: string,
    value: number,
    reported: number | null | undefined,
  ) =>
    add(
      { id, question, name, definition, status: 'calculado', statusNote: null },
      arith(
        [
          { op: null, operand: ref(monthly) },
          { op: '×', operand: param('Porcentaje de referencia', value, factor(value), 'Fracción de la renta mensual que se toma como cuota') },
        ],
        money,
      ),
      {
        format: money,
        reported,
        tolerance: 1,
        plain: (display) =>
          `El ${formatRate(value, 0)} de la renta neta mensual de ${monthly.display} es ${display}.`,
      },
    )
  const mortgage = share(
    'limite-hipotecario',
    '¿Cuánto se podría pagar de dividendo al mes?',
    'Límite capacidad crédito hipotecario mensual',
    'La cuota mensual de referencia para un crédito hipotecario: una fracción fija de la renta financiera neta mensual.',
    method.mortgageFactor,
    null,
  )
  share(
    'cuota-automotriz',
    '¿Cuánto se podría pagar de cuota por un crédito automotriz?',
    'Límite capacidad crédito automotriz',
    'La cuota mensual de referencia para un crédito automotriz: una fracción fija de la renta financiera neta mensual.',
    method.autoFactor,
    null,
  )

  // 10. BIT en UTA
  const utaValue = method.utaByYear[year] ?? null
  const bit = add(
    {
      id: 'bit-uta',
      question: '¿A cuántas UTA equivale la base imponible?',
      name: 'Base imponible en UTA',
      definition:
        'La base imponible expresada en Unidades Tributarias Anuales, la medida con que la ley define los tramos.',
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: sii('Base imponible', '170', 'base', base170) },
        {
          op: '÷',
          operand: param(
            'Valor de la UTA',
            utaValue,
            utaValue === null ? '—' : money(utaValue),
            `UTA de diciembre de ${year}`,
          ),
        },
      ],
      uta,
      0,
      false,
    ),
    {
      format: uta,
      reported: fin?.bitUta,
      tolerance: 0.051,
      plain: (display) => `La base imponible de ${base.display} equivale a ${display}.`,
    },
  )

  // 11 y 12. Tramos
  const tramo = (
    id: string,
    question: string,
    name: string,
    definition: string,
    status: CalcStatus,
    statusNote: string | null,
    ranges: (UtaRange & { rate?: number })[],
    reported: string | null,
    plain: (label: string) => string,
  ) => {
    const current = bit.value === null ? undefined : findRange(ranges, bit.value)
    const label = current
      ? current.rate === undefined
        ? current.label
        : `${current.label} · ${formatRate(current.rate, 1)}`
      : '—'
    const ok = declared && current !== undefined
    const calc: Calc = {
      id,
      question,
      name,
      definition,
      status,
      statusNote,
      state: ok ? 'ok' : 'sin_dato',
      value: null,
      display: label,
      plain: !declared ? FIXED.noYear : ok ? plain(label) : FIXED.noData,
      equation: ok
        ? {
            kind: 'ranges',
            input: ref(bit),
            ranges: ranges.map((item, index) => ({
              label:
                item.rate === undefined ? item.label : `${item.label} · ${formatRate(item.rate, 1)}`,
              range: rangeText(ranges, index),
              current: item === current,
            })),
          }
        : null,
      check:
        ok && reported !== null && current && reported !== current.label
          ? `El valor informado por el sistema es ${reported}.`
          : null,
      dependsOn: ok ? [bit.id] : [],
    }
    calcs.push(calc)
    return calc
  }
  tramo(
    'tramo-55bis',
    '¿En qué tramo del Art. 55 bis queda?',
    'Tramo Art. 55 bis',
    'La clasificación de la base imponible en UTA que define cuánto se pueden rebajar los intereses hipotecarios: completo en el tramo A, en parte en el B y nada en el C.',
    'calculado',
    null,
    method.bracket55bis,
    declared ? (igcBase.bracket55bis[year] ?? null) : null,
    (label) => `Con ${bit.display}, el tramo del Art. 55 bis es ${label}.`,
  )

  // Rebaja máxima de intereses del Art. 55 bis
  const cap = method.interest55bis
  const capShare =
    bit.value === null
      ? null
      : bit.value <= cap.fullUntilUta
        ? 1
        : bit.value >= cap.zeroFromUta
          ? 0
          : Math.min(1, Math.max(0, (cap.constant - cap.slope * bit.value) / 100))
  const capValue = capShare === null ? null : Math.round(cap.capUta * capShare * 100) / 100
  const capText = `${formatDecimal(cap.capUta, 0)} UTA`
  add(
    {
      id: 'tope-55bis',
      question: '¿Cuánto interés hipotecario se puede rebajar como máximo?',
      name: 'Rebaja máxima de intereses (Art. 55 bis)',
      definition: `El tope anual de intereses de créditos hipotecarios que se puede rebajar de la base imponible. Es de ${capText} y disminuye cuando la base imponible supera las ${formatDecimal(cap.fullUntilUta, 0)} UTA, hasta llegar a cero en ${formatDecimal(cap.zeroFromUta, 0)} UTA.`,
      status: 'calculado',
      statusNote: null,
    },
    {
      value: capValue,
      equation: {
        kind: 'formula',
        formula: `Tope × porcentaje. Porcentaje: 100% hasta ${formatDecimal(cap.fullUntilUta, 0)} UTA; ${formatDecimal(cap.constant, 0)} − ${formatDecimal(cap.slope, 3)} × base en UTA entre ${formatDecimal(cap.fullUntilUta, 0)} y ${formatDecimal(cap.zeroFromUta, 0)} UTA; 0% desde ${formatDecimal(cap.zeroFromUta, 0)} UTA`,
        operands: [ref(bit), param('Tope legal', cap.capUta, capText, 'Art. 55 bis de la Ley de la Renta')],
        result: capValue === null ? '—' : uta(capValue),
      },
    },
    {
      format: uta,
      plain: (display) =>
        `Con ${bit.display} corresponde ${formatRate(capShare ?? 0, 2)} del tope de ${capText}: ${display}, que son ${money((capValue ?? 0) * (utaValue ?? 0))}.`,
    },
  )
  tramo(
    'tramo-igc',
    '¿En qué tramo del Impuesto Global Complementario queda?',
    'Tramo de Global Complementario',
    'El tramo de la tabla del Impuesto Global Complementario que corresponde a la base imponible en UTA. La tasa del tramo se aplica solo a la parte de la base que cae en él.',
    'por_confirmar',
    'La tabla es la del Art. 52 de la Ley de la Renta para cada año tributario. Falta cargar la tabla oficial de cada año; mientras tanto se usa la tabla general en UTA.',
    method.igcBrackets,
    null,
    (label) => `Con ${bit.display}, el tramo de Global Complementario es ${label}.`,
  )

  // 13 a 15. Credit Capacity
  // La tasa y el plazo parten en la referencia y la persona puede ajustarlos.
  const creditRate = credit?.rate ?? method.mortgageRate
  const creditYears = credit?.years ?? method.mortgageYears
  const creditOrigin = creditSource(method, { rate: creditRate, years: creditYears })
  const months = Math.round(creditYears * 12)
  const pv = mortgage.value === null ? null : Math.round(presentValue(mortgage.value, creditRate, months))
  const capacity = add(
    {
      id: 'credit-capacity',
      question: '¿Qué monto de crédito se podría pagar con ese dividendo?',
      name: 'Credit Capacity',
      definition:
        'El monto de crédito que se paga con el dividendo de referencia, a una tasa y un plazo dados. Es el valor presente de esas cuotas. La tasa y el plazo dependen de cada institución, por eso se pueden ajustar.',
      status: 'calculado',
      statusNote: null,
    },
    {
      value: pv,
      equation: {
        kind: 'formula',
        formula: 'Dividendo × (1 − (1 + tasa mensual) ^ −meses) ÷ tasa mensual',
        operands: [
          ref(mortgage),
          param('Tasa anual', creditRate, formatRateExact(creditRate), creditOrigin),
          param('Plazo', months, `${months} meses`, creditOrigin),
        ],
        result: pv === null ? '—' : money(pv),
      },
    },
    {
      format: money,
      plain: (display) =>
        `Un dividendo de ${mortgage.display} al mes durante ${months} meses, con ${formatRateExact(creditRate)} de interés anual, paga un crédito de ${display}.`,
    },
  )
  const capacityUf = add(
    {
      id: 'credit-capacity-uf',
      question: '¿Cuánto es ese monto de crédito en UF?',
      name: 'Credit Capacity en UF',
      definition: 'El Credit Capacity dividido por el valor de la UF de referencia.',
      status: 'por_confirmar',
      statusNote: 'El valor de la UF es el que informa el SII. Falta confirmar de qué fecha se toma.',
    },
    arith(
      [
        { op: null, operand: ref(capacity) },
        {
          op: '÷',
          operand: param(
            'Valor de la UF',
            method.uf.value,
            `$${formatDecimal(method.uf.value, 2)}`,
            `UF del ${formatDate(method.uf.date)}`,
          ),
        },
      ],
      (value) => formatUf(value, 0),
      0,
      false,
    ),
    {
      format: (value) => formatUf(value, 0),
      zero: method.uf.value === 0 ? 'el valor de la UF' : undefined,
      plain: (display) => `${capacity.display} equivalen a ${display}.`,
    },
  )
  const leverageOk = capacityUf.value !== null
  calcs.push({
    id: 'factor-leverage',
    question: '¿Cuántas veces ese monto financia una institución?',
    name: 'Factor leverage',
    definition:
      'El número de veces que una institución está dispuesta a financiar por sobre el Credit Capacity personal. Cada institución define el suyo.',
    status: 'calculado',
    statusNote: null,
    state: !declared ? 'sin_dato' : leverageOk ? 'ok' : 'sin_dato',
    value: null,
    display: leverageOk ? `× ${method.leverageFactors.join(', ')}` : '—',
    plain: !declared
      ? FIXED.noYear
      : leverageOk
        ? `El factor leverage multiplica el Credit Capacity de ${capacityUf.display}.`
        : FIXED.noData,
    equation: leverageOk
      ? {
          kind: 'multiples',
          base: ref(capacityUf),
          rows: method.leverageFactors.map((item) => ({
            label: `Factor ${item}`,
            result: formatUf((capacityUf.value as number) * item, 0),
          })),
        }
      : null,
    check: null,
    dependsOn: leverageOk ? [capacityUf.id] : [],
  })

  return calcs
}

// ---------- Cálculos de propiedades ----------

export function buildPropertyCalcs(report: Report): { summary: PatrimonySummary; calcs: Calc[] } {
  const summary = summarizeProperties(report.properties)
  const none = summary.count === 0
  const group = (label: string, value: number | null, count = summary.count): Operand => ({
    kind: 'sii',
    label,
    value,
    display: value === null ? '—' : ufAmount(value),
    source: `Bienes raíces · ${count} ${count === 1 ? 'propiedad' : 'propiedades'}`,
    table: 'patrimonio',
  })
  const ref = (calc: Calc): Operand => ({
    kind: 'calc',
    label: calc.name,
    value: calc.value,
    display: calc.display,
    source: 'Calculado en este informe',
    calcId: calc.id,
  })
  const make = (
    base: Pick<Calc, 'id' | 'question' | 'name' | 'definition'>,
    value: number | null,
    terms: { op: Op | null; operand: Operand }[],
    plain: (display: string) => string,
  ): Calc => {
    const ok = !none && value !== null
    const display = ok ? ufAmount(value) : '—'
    return {
      ...base,
      status: 'calculado',
      statusNote: null,
      state: ok ? 'ok' : 'sin_dato',
      value: ok ? value : null,
      display,
      plain: none ? FIXED.noProperties : ok ? plain(display) : FIXED.noData,
      equation: ok ? { kind: 'arith', terms, zeros: 0, result: display } : null,
      check: null,
      dependsOn: ok ? terms.map((term) => term.operand.calcId).filter((id) => id !== undefined) : [],
    }
  }

  const activos = make(
    {
      id: 'prop-activos',
      question: '¿Cuánto costaron las propiedades?',
      name: 'Activos (enajenación total)',
      definition: 'La suma de los precios de compra de las propiedades inscritas, en UF.',
    },
    summary.enajenacionUf,
    [{ op: null, operand: group('Suma de los montos de enajenación', summary.enajenacionUf) }],
    (display) => `Las ${summary.count} propiedades inscritas se compraron por ${display} en total.`,
  )
  const patrimonio = make(
    {
      id: 'prop-patrimonio',
      question: '¿Cuánto se pagó al contado?',
      name: 'Patrimonio (pago contado total)',
      definition: 'La suma de lo pagado al contado al comprar las propiedades, en UF.',
    },
    summary.pagoContadoUf,
    [{ op: null, operand: group('Suma de los pagos al contado', summary.pagoContadoUf) }],
    (display) => `Al comprarlas se pagaron ${display} al contado.`,
  )
  const pasivos = make(
    {
      id: 'prop-pasivos',
      question: '¿Cuánto se financió con crédito?',
      name: 'Pasivos de origen',
      definition:
        'La parte del precio de compra que no se pagó al contado. Es lo financiado al comprar, no la deuda vigente.',
    },
    summary.pasivosUf,
    [
      { op: null, operand: ref(activos) },
      { op: '−', operand: ref(patrimonio) },
    ],
    (display) =>
      `De los ${activos.display} que costaron las propiedades, ${patrimonio.display} se pagaron al contado: la diferencia es ${display}.`,
  )
  const afecto =
    summary.enajenacionUf === null
      ? null
      : Math.round((summary.enajenacionUf - (summary.ley20455Uf ?? 0)) * 100) / 100
  const ley = make(
    {
      id: 'ley-20455',
      question: '¿Qué monto de adquisición queda fuera del beneficio de la Ley 20.455?',
      name: 'Adquisición sin las propiedades acogidas a la Ley 20.455',
      definition:
        'La Ley 20.455 libera de impuesto los arriendos de las dos primeras propiedades habitacionales DFL2. Este monto es el total de adquisición sin esas propiedades.',
    },
    afecto,
    [
      { op: null, operand: ref(activos) },
      {
        op: '−',
        operand: group(
          'Enajenación de las propiedades acogidas',
          summary.ley20455Uf ?? 0,
          summary.ley20455Count,
        ),
      },
    ],
    (display) =>
      `Sin las ${summary.ley20455Count} propiedades acogidas a la Ley 20.455, el monto de adquisición es ${display}.`,
  )

  return { summary, calcs: [activos, patrimonio, pasivos, ley, buildPlazoCalc(report)] }
}

// Plazo transcurrido del crédito de cada propiedad: desde la escritura hasta la captura,
// con tope en el plazo pactado. El SII no informa los dividendos pagados: queda por confirmar.
function buildPlazoCalc(report: Report): Calc {
  const captura = formatDate(report.taxpayer.capturedAt)
  const financed = report.properties.filter(
    (item) =>
      item.institucion !== null ||
      (item.enajenacionUf !== null && item.pagoContadoUf !== null && item.enajenacionUf > item.pagoContadoUf),
  )
  const operands: Operand[] = financed.map((item) => {
    const plazo = plazoCredito(item, report.taxpayer.capturedAt)
    const escritura = item.fechaAdquisicion ?? item.fechaInscripcion
    return {
      kind: 'calc',
      label: `Rol ${item.rol} · ${item.comuna}`,
      value: plazo?.transcurridoMeses ?? null,
      display: plazo ? PLAZO_TEXT.of(formatMeses(plazo.transcurridoMeses), formatMeses(plazo.pactadoMeses)) : PLAZO_TEXT.sinPlazo,
      source: plazo && escritura ? PLAZO_TEXT.source(formatDate(escritura), formatMeses(plazo.pactadoMeses)) : PLAZO_TEXT.sinPlazo,
    }
  })
  const counted = operands.filter((operand) => operand.value !== null).length
  const ok = counted > 0
  const display = ok ? `${counted} ${counted === 1 ? 'crédito' : 'créditos'}` : '—'
  return {
    id: 'plazo-credito',
    question: PLAZO_TEXT.question,
    name: PLAZO_TEXT.name,
    definition: PLAZO_TEXT.definition,
    status: PLAZO_TEXT.status,
    statusNote: PLAZO_TEXT.statusNote,
    state: ok ? 'ok' : 'sin_dato',
    value: ok ? counted : null,
    display,
    plain:
      report.properties.length === 0
        ? FIXED.noProperties
        : financed.length === 0
          ? PLAZO_TEXT.ninguna
          : ok
            ? PLAZO_TEXT.todas(counted, captura)
            : PLAZO_TEXT.sinPlazo,
    equation: ok ? { kind: 'formula', formula: PLAZO_TEXT.formula, operands, result: display } : null,
    check: null,
    dependsOn: [],
  }
}

// ---------- Análisis inmobiliario: deuda por institución y lo que está por determinar ----------

export function buildRealEstate(summary: PatrimonySummary): { calcs: Calc[]; pending: PendingItem[] } {
  const none = summary.count === 0
  const plural = (count: number) => `${count} ${count === 1 ? 'propiedad' : 'propiedades'}`
  const bank = (item: PatrimonySummary['byBank'][number]): Operand => ({
    kind: 'sii',
    label: item.bank,
    value: item.debtUf,
    display: item.debtUf === null ? '—' : ufAmount(item.debtUf),
    source: `Bienes raíces · ${plural(item.properties)}`,
    table: 'patrimonio',
  })

  const total = sumKnown(summary.byBank.map((item) => item.debtUf))
  const ok = !none && total !== null
  const display = ok ? ufAmount(Math.round(total * 100) / 100) : '—'
  const deuda: Calc = {
    id: 'deuda-institucion',
    question: '¿Con qué instituciones se financiaron las propiedades?',
    name: 'Deuda de origen por institución',
    definition:
      'La deuda de origen de cada propiedad es su monto de enajenación menos lo que se pagó al contado. Aquí se suma según la institución que financió la compra. Es lo financiado al comprar, no la deuda vigente.',
    status: 'calculado',
    statusNote: null,
    state: ok ? 'ok' : 'sin_dato',
    value: ok ? Math.round(total * 100) / 100 : null,
    display,
    plain: none
      ? FIXED.noProperties
      : ok
        ? `Las propiedades suman ${display} de deuda de origen, agrupada según quién financió cada compra.`
        : FIXED.noData,
    equation: ok
      ? {
          kind: 'parts',
          rows: summary.byBank.map((item) => ({
            operand: bank(item),
            note: item.share === null ? 'Monto no capturado' : `${formatRate(item.share, 1)} de la deuda`,
          })),
          total: display,
        }
      : null,
    check: null,
    dependsOn: [],
  }

  const pending: PendingItem[] = [
    {
      id: 'leverage-institucion',
      name: 'Leverage por institución y total',
      definition:
        'Cuántas veces la deuda de origen supera la capacidad propia de la persona. El de cada institución es su deuda dividida por un mismo número, y la suma de todos da el leverage total.',
      inputs: summary.byBank.map(bank),
      missing:
        'Falta definir por qué número se divide la deuda y con la UF de qué fecha.',
    },
    {
      id: 'recomendacion-20455',
      name: 'Recomendación sobre la Ley 20.455',
      definition:
        'Una recomendación sobre incorporar las propiedades al régimen de Primera Categoría.',
      inputs: [],
      missing:
        'Falta confirmar si la recomendación es igual para todas las personas o depende de sus datos.',
    },
  ]

  return { calcs: [deuda], pending }
}

// Cuántos cálculos del informe están por confirmar o por determinar (último año).
export function countPending(report: Report): number {
  const last = report.years[report.years.length - 1]
  const property = buildPropertyCalcs(report)
  const estate = buildRealEstate(property.summary)
  const calcs = [...(last === undefined ? [] : buildYearCalcs(report, last)), ...property.calcs, ...estate.calcs]
  return calcs.filter((calc) => calc.status !== 'calculado').length + estate.pending.length
}

// ---------- Relaciones entre cálculos y datos ----------

export function operandsOf(equation: Equation): Operand[] {
  switch (equation.kind) {
    case 'arith':
      return equation.terms.map((term) => term.operand)
    case 'formula':
      return equation.operands
    case 'parts':
      return equation.rows.map((row) => row.operand)
    case 'ranges':
      return [equation.input]
    case 'multiples':
      return [equation.base]
  }
}

// Qué cálculos usan cada resultado.
export function usedBy(calcs: Calc[]): Map<string, Calc[]> {
  const map = new Map<string, Calc[]>()
  for (const calc of calcs) {
    for (const id of calc.dependsOn) map.set(id, [...(map.get(id) ?? []), calc])
  }
  return map
}

// Qué cálculos usan cada fila de las tablas del SII: clave "tabla:fila".
export function usageByCode(calcs: Calc[]): Map<string, Calc[]> {
  const map = new Map<string, Calc[]>()
  for (const calc of calcs) {
    if (!calc.equation) continue
    for (const operand of operandsOf(calc.equation)) {
      if (operand.kind !== 'sii' || !operand.table || !operand.row) continue
      const key = `${operand.table}:${operand.row}`
      const list = map.get(key) ?? []
      if (!list.includes(calc)) map.set(key, [...list, calc])
    }
  }
  return map
}
