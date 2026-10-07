import type { Report, UtaRange } from '../types'
import {
  formatAt,
  formatDate,
  formatDecimal,
  formatMoney,
  formatRate,
  formatRateExact,
  formatUf,
} from './format'
import { presentValue } from './icred'
import { sumKnown, summarizeProperties, type PatrimonySummary } from './patrimonio'

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
  // De dónde viene: formulario, código y año; regla del método; u otro cálculo.
  source: string
  // Sección del informe donde está el dato (kind 'sii') o cálculo que lo produce.
  table?: SiiTable
  code?: string
  // Fila de la tabla de origen (el código, o un identificador si no tiene código).
  row?: string
  calcId?: string
}

export type Equation =
  | { kind: 'arith'; terms: { op: Op | null; operand: Operand }[]; zeros: number; result: string }
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
  param: 'Parámetro del método',
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
      const equation: Equation = { kind: 'arith', terms: [], zeros: rows.length, result: money(0) }
      return { value: 0, equation }
    }
    return arith(terms, money, rows.length - active.length)
  }

  // 1. Total de orígenes de renta
  const total = add(
    {
      id: 'total-origenes',
      question: '¿Cuánto se declaró en el año?',
      name: 'Total de orígenes de renta',
      definition:
        'La suma de todas las rentas declaradas al SII en el año: sueldos, honorarios, arriendos, dividendos, intereses y otras.',
      status: 'calculado',
      statusNote: null,
    },
    sumOf(
      report.incomeOrigins.map((item) => ({
        label: item.label,
        code: item.code,
        row: item.code,
        value: fromF22(item.values[year]),
      })),
      'origenes',
    ),
    {
      format: money,
      reported: fin?.totalOrigins,
      plain: (display) => `En la declaración de renta ${year} se informaron rentas por ${display}.`,
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
      question: '¿Cuánto de lo declarado cuenta como ingreso personal?',
      name: 'Renta financiera bruta (RFB)',
      definition:
        'Las rentas del año que el método considera ingreso personal: el total declarado, sin arriendos ni rentas exentas, más el gasto presunto de honorarios.',
      status: 'por_confirmar',
      statusNote:
        'Los códigos que se restan y se suman se dedujeron de los casos de referencia. En ellos, el valor del sistema difiere entre 5 y 10 pesos de esta operación.',
    },
    arith(
      [
        { op: null, operand: ref(total) },
        ...method.rfbExcludedCodes.map((code) => ({
          op: '−' as Op,
          operand: sii(originLabel(code), code, 'origenes', origin(code)),
        })),
        ...method.rfbAddCodes.map((code) => ({
          op: '+' as Op,
          operand: sii(adjustmentLabel(code), code, 'ajustes', adjustment(code)),
        })),
      ],
      money,
    ),
    {
      format: money,
      reported: fin?.rfb,
      plain: (display) =>
        `De los ${total.display} declarados, ${display} cuentan como ingreso personal según el método.`,
    },
  )

  // 6. Renta financiera neta
  const rule = method.rfnFactorRule
  // Con base imponible 0 no hay tasa; para la regla del factor equivale a tasa 0.
  const ruleRate = rate.value ?? (base170 === 0 ? 0 : null)
  const rfnFactor =
    ruleRate === null ? null : ruleRate < rule.rateThreshold ? rule.factorBelow : rule.factorFrom
  const rfn = add(
    {
      id: 'renta-neta',
      question: '¿Cuánto queda como renta neta?',
      name: 'Renta financiera neta (RFN)',
      definition: `La renta financiera bruta multiplicada por el factor de renta neta del método: ${factor(rule.factorBelow)} si la tasa efectiva es menor a ${formatRate(rule.rateThreshold, 0)}; ${factor(rule.factorFrom)} si es ${formatRate(rule.rateThreshold, 0)} o más.`,
      status: 'calculado',
      statusNote: null,
    },
    arith(
      [
        { op: null, operand: ref(rfb) },
        {
          op: '×',
          operand: param(
            'Factor de renta neta',
            rfnFactor,
            rfnFactor === null ? '—' : factor(rfnFactor),
            `Regla del método según la tasa efectiva (${rate.display})`,
          ),
        },
      ],
      money,
    ),
    {
      format: money,
      reported: fin?.rfn,
      tolerance: 1,
      plain: (display) =>
        `A la renta financiera bruta de ${rfb.display} se le aplica el factor ${rfnFactor === null ? '—' : factor(rfnFactor)}: quedan ${display}.`,
    },
  )
  rfn.dependsOn = [...new Set([...rfn.dependsOn, rate.id])]

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
      reported: fin?.rfnMonthly,
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
          { op: '×', operand: param('Factor del método', value, factor(value), 'Capítulo IV: factor de referencia recomendado') },
        ],
        money,
      ),
      {
        format: money,
        reported,
        tolerance: 1,
        plain: (display) =>
          `El método toma ${formatRate(value, 0)} de la renta mensual de ${monthly.display}: ${display}.`,
      },
    )
  const mortgage = share(
    'limite-hipotecario',
    '¿Cuánto se podría pagar de dividendo al mes?',
    'Límite capacidad crédito hipotecario',
    'La cuota mensual de referencia para un crédito hipotecario: una fracción fija de la renta financiera neta mensual.',
    method.mortgageFactor,
    fin?.mortgageLimit,
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
  // La tasa y el plazo parten en la referencia del Capítulo IV y la persona puede ajustarlos.
  const creditRate = credit?.rate ?? method.mortgageRate
  const creditYears = credit?.years ?? method.mortgageYears
  const creditSource =
    creditRate === method.mortgageRate && creditYears === method.mortgageYears
      ? 'Referencia del Capítulo IV'
      : 'Valor ajustado en este informe'
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
          param('Tasa anual', creditRate, formatRateExact(creditRate), creditSource),
          param('Plazo', months, `${months} meses`, creditSource),
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

  return { summary, calcs: [activos, patrimonio, pasivos, ley] }
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
        'Cuántas veces la deuda de origen supera la capacidad propia de la persona. En la herramienta de referencia, el leverage de cada institución es su deuda dividida por un mismo número, y la suma de todos da el leverage total.',
      inputs: summary.byBank.map(bank),
      missing:
        'Falta saber por qué número se divide la deuda y con la UF de qué fecha. La herramienta de referencia muestra el resultado, pero no ese número.',
    },
    {
      id: 'recomendacion-20455',
      name: 'Recomendación sobre la Ley 20.455',
      definition:
        'El informe de referencia cierra con una recomendación sobre incorporar las propiedades al régimen de Primera Categoría.',
      inputs: [],
      missing:
        'Falta confirmar si esa recomendación es un texto fijo para todos los casos o depende de una regla.',
    },
  ]

  return { calcs: [deuda], pending }
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
