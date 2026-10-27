import { describe, expect, it } from 'vitest'
import { allDebtTexts, checkDebtFile, CMF_URL, DEBT_TEXT, formatBytes, MAX_BYTES } from '../informeDeudas'
import { DEBT_CHECK_STEPS, isFinal, isRejection, type DebtCheckStatus } from '../verificacionDeudas'

const pdfHead = '%PDF-1.4\n'

describe('informe de deudas', () => {
  it('apunta a la dirección exacta del portal de la CMF', () => {
    expect(CMF_URL).toBe('https://conocetudeuda.cmfchile.cl/informe-deudas/')
  })

  it('acepta un PDF y rechaza lo que no lo es, lo vacío y lo muy grande', async () => {
    expect(await checkDebtFile(new File([pdfHead], 'informe.pdf', { type: 'application/pdf' }))).toBeNull()
    // Algunos navegadores no informan el tipo: basta la extensión y la firma.
    expect(await checkDebtFile(new File([pdfHead], 'INFORME.PDF'))).toBeNull()
    expect(await checkDebtFile(new File(['hola'], 'notas.txt', { type: 'text/plain' }))).toBe(DEBT_TEXT.errors.notPdf)
    expect(await checkDebtFile(new File(['hola'], 'falso.pdf', { type: 'application/pdf' }))).toBe(DEBT_TEXT.errors.notPdf)
    expect(await checkDebtFile(new File([], 'vacio.pdf', { type: 'application/pdf' }))).toBe(DEBT_TEXT.errors.empty)
    const big = new File([pdfHead, new Uint8Array(MAX_BYTES)], 'grande.pdf', { type: 'application/pdf' })
    expect(await checkDebtFile(big)).toBe(DEBT_TEXT.errors.tooBig)
  })

  it('escribe el tamaño del archivo en es-CL', () => {
    expect(formatBytes(512)).toBe('512\u00a0B')
    expect(formatBytes(1883)).toBe('2\u00a0KB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2,5\u00a0MB')
  })

  it('sus textos fijos no nombran metodologías ni evalúan el caso', () => {
    const FORBIDDEN = /m[ée]todo|icred|cap[íi]tulo|casos? de referencia|bueno|malo|riesgo|sano/i
    const texts = allDebtTexts()
    expect(texts.length).toBeGreaterThan(30)
    for (const text of texts) expect(text).not.toMatch(FORBIDDEN)
  })

  it('cada paso y cada motivo de rechazo tiene su texto', () => {
    expect(DEBT_CHECK_STEPS.map((key) => DEBT_TEXT.checkSteps[key])).toEqual([
      'Leyendo el PDF',
      'Buscando el código QR',
      'Validando con la CMF',
    ])
    expect(DEBT_TEXT.rejected.NO_QR).toContain('no trae el código QR')
    expect(DEBT_TEXT.rejected.NOT_CMF).toContain('no corresponde a la CMF')
    expect(DEBT_TEXT.rejected.MISMATCH).toContain('no coincide')
    expect(DEBT_TEXT.service).toContain('No es un problema de tu documento')
  })

  it('separa los rechazos del documento del error del servicio', () => {
    const all: DebtCheckStatus[] = ['RUNNING', 'VERIFIED', 'NO_QR', 'NOT_CMF', 'MISMATCH', 'SERVICE_ERROR', 'CANCELLED']
    expect(all.filter(isRejection)).toEqual(['NO_QR', 'NOT_CMF', 'MISMATCH'])
    expect(all.filter((status) => !isFinal(status))).toEqual(['RUNNING'])
  })

  it('la carpeta dice que se verificó con el código QR, sin afirmar más', () => {
    expect(DEBT_TEXT.printVerified('27-10-2026', '14:30', false)).toBe(
      'Verificado con el código QR del documento el 27-10-2026 a las 14:30.',
    )
    expect(DEBT_TEXT.printVerified('27-10-2026', '14:30', true)).toBe(
      'Verificado con el código QR del documento el 27-10-2026 a las 14:30 (verificación simulada).',
    )
    expect(DEBT_TEXT.printSource('informe.pdf', '27-10-2026')).not.toMatch(/no verifica/)
  })
})
