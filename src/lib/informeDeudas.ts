// Informe de deudas de la CMF: complemento opcional de la carpeta crediticia.
// No entra en ningún cálculo ni se interpreta: se muestra y se imprime tal como se cargó.
// Los textos son fijos, iguales para cualquier persona; los datos del trámite salen de la
// ficha de ChileAtiende y del portal de la CMF (revisados en octubre de 2026).

import type { StepState } from '../types'
import type { DebtCheckStepKey, DebtRejection } from './verificacionDeudas'

export const CMF_URL = 'https://conocetudeuda.cmfchile.cl/informe-deudas/'
export const CMF_FICHA_URL = 'https://www.chileatiende.gob.cl/fichas/2614-informe-de-deudas-del-sistema-financiero'

export const MAX_MB = 15
export const MAX_BYTES = MAX_MB * 1024 * 1024
// Un informe de deudas tiene pocas páginas; un archivo mucho más largo es otro documento.
export const MAX_PAGES = 50

export const DEBT_TEXT = {
  nav: 'Informe de deudas',
  navGroup: 'Complementos',
  navOptional: 'Opcional · Recomendado',
  title: 'Informe de deudas',
  printTitle: 'Informe de deudas (CMF)',
  lead: 'El informe oficial de la Comisión para el Mercado Financiero (CMF) con tus deudas en el sistema financiero.',
  tag: 'Opcional · Recomendado',

  guideTitle: 'Cómo obtenerlo en la CMF',
  guideUpdateTitle: 'Cómo obtener un informe actualizado en la CMF',
  urlLabel: 'Dirección exacta del portal de la CMF',
  open: 'Abrir el portal de la CMF',
  openHint: '(se abre en una pestaña nueva)',
  copy: 'Copiar enlace',
  copied: 'Copiado',
  copiedStatus: 'Enlace copiado.',
  copyFailed: 'No se pudo copiar. Selecciona el enlace y cópialo.',
  outside: 'El trámite se hace en el sitio de la CMF, fuera de Innovacred. Innovacred no ve tu ClaveÚnica.',
  steps: [
    'Entra al portal de la CMF con el enlace de arriba.',
    'Ingresa con tu ClaveÚnica.',
    'Confirma tu identidad con el código que llega a tu correo electrónico.',
    'Descarga el informe en PDF.',
  ],
  lastStep: 'Vuelve aquí y carga el PDF.',
  goUpload: 'Ir a la carga',
  facts: [
    { label: 'Requisitos', text: 'ClaveÚnica y cédula de identidad.' },
    { label: 'Costo', text: 'Gratis.' },
    { label: 'Qué contiene', text: 'Las deudas que mantienes con entidades supervisadas por la CMF.' },
    {
      label: 'Actualización',
      text: 'Semanal, con un desfase de entre 10 y 20 días respecto de la fecha de la consulta.',
    },
  ],
  company:
    'Para una empresa (persona jurídica) el trámite es otro: se pide por Atención en línea de la CMF y la respuesta llega al correo en hasta 10 días hábiles.',
  sourceLabel: 'Fuente del trámite:',
  sourceLink: 'ficha de ChileAtiende',

  uploadTitle: 'Carga el informe',
  why: 'Es opcional y recomendado: completa tu carpeta crediticia. Al cargarlo se verifica con su código QR y, si es válido, se agrega al final del PDF del informe tal como lo cargaste. Innovacred no hace cálculos con él ni lo interpreta.',
  drop: 'Arrastra el PDF aquí',
  or: 'o',
  choose: 'Elegir el PDF',
  hint: `Solo PDF, hasta ${MAX_MB}\u00a0MB.`,
  dropActive: 'Suelta el PDF para cargarlo',
  privacy:
    'En esta demo el archivo se procesa solo en este navegador y no se envía a ningún servidor. Se mantiene mientras dure esta sesión: si recargas la página o la cierras, tendrás que cargarlo de nuevo.',

  // Verificación con el código QR del documento.
  checkTitle: 'Verificando el documento',
  checkSteps: {
    LEER_PDF: 'Leyendo el PDF',
    BUSCAR_QR: 'Buscando el código QR',
    VALIDAR_CMF: 'Validando con la CMF',
  } satisfies Record<DebtCheckStepKey, string>,
  stepState: { done: 'listo', running: 'en curso', queued: 'pendiente', error: 'no se pudo' } satisfies Record<StepState, string>,
  checkStatus: (step: string) => `${step}…`,
  checkKeep: 'Tu informe verificado se mantiene hasta que el nuevo quede verificado.',
  simulated: 'Modo demo: la verificación es simulada.',
  cancel: 'Cancelar',
  cancelledStatus: 'Se canceló la verificación. El archivo no se guardó.',

  rejectedTitle: 'El documento no se aceptó',
  rejected: {
    NO_QR:
      'El PDF no trae el código QR del informe de la CMF. Puede ser una copia, una captura o un archivo modificado.',
    NOT_CMF: 'El código QR del PDF no corresponde a la CMF.',
    MISMATCH: 'El contenido del PDF no coincide con el informe que la CMF registra para ese código QR.',
  } satisfies Record<DebtRejection, string>,
  rejectedNext:
    'No se guardó ni se agregó a la carpeta. Descarga un informe nuevo desde el portal de la CMF y cárgalo sin cambios.',
  rejectedStatus: (reason: string) => `El documento no se aceptó. ${reason}`,
  serviceTitle: 'No se pudo verificar ahora',
  service:
    'El servicio de verificación no respondió. No es un problema de tu documento: puedes reintentar o cargar otro PDF.',
  retry: 'Reintentar',
  chooseOther: 'Cargar otro PDF',
  keepVerified: 'Mantener el informe verificado',

  verifiedSeal: 'Verificado con la CMF · código QR',
  verifiedWhen: (date: string, time: string) => `el ${date} a las ${time}`,
  verifiedStatus: (pages: number) => `Documento verificado con su código QR: ${pagesLabel(pages)}.`,
  navChecking: 'Verificando…',
  navVerified: 'Verificado',

  removedStatus: 'Se quitó el informe de deudas.',
  meta: (pages: number, size: string, date: string, time: string) =>
    `${pagesLabel(pages)} · ${size} · cargado el ${date} a las ${time}`,
  asLoaded: 'Se muestra tal como se cargó y se agrega al final del PDF del informe.',
  replace: 'Reemplazar',
  remove: 'Quitar',
  pagesLabel: 'Páginas del informe de deudas',
  pageAlt: (page: number, total: number) => `Página ${page} de ${total} del informe de deudas`,
  pageCaption: (page: number, total: number) => `Página ${page} de ${total}`,

  printSource: (name: string, date: string) =>
    `Documento cargado por la persona el ${date} (${name}): su informe de deudas de la Comisión para el Mercado Financiero (CMF), que se obtiene en conocetudeuda.cmfchile.cl. Se reproduce tal como se cargó, sin cálculos ni interpretación.`,
  printVerified: (date: string, time: string, simulated: boolean) =>
    `Verificado con el código QR del documento el ${date} a las ${time}${simulated ? ' (verificación simulada)' : ''}.`,
  printNone: 'No se cargó el informe de deudas; es opcional.',

  errors: {
    notPdf: 'Ese archivo no es un PDF. Carga el informe en PDF que descargaste de la CMF.',
    tooBig: `El archivo pesa más de ${MAX_MB}\u00a0MB. Carga el PDF del informe tal como lo descargaste de la CMF.`,
    empty: 'El archivo está vacío. Descarga de nuevo el informe desde la CMF.',
    several: 'Carga un solo archivo: el PDF del informe de deudas.',
    unreadable: 'No se pudo leer el PDF. Revisa que el archivo esté completo y vuelve a cargarlo.',
    password: 'El PDF está protegido con clave y no se puede mostrar. Carga una versión sin clave.',
    tooManyPages: `El PDF tiene más de ${MAX_PAGES} páginas; no parece un informe de deudas.`,
  },
}

function pagesLabel(pages: number) {
  return `${pages} ${pages === 1 ? 'página' : 'páginas'}`
}

export function formatBytes(bytes: number) {
  // Espacio sin corte entre la cifra y la unidad.
  if (bytes < 1024) return `${bytes}\u00a0B`
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}\u00a0KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-CL', { maximumFractionDigits: 1 })}\u00a0MB`
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function isoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Antes de leer el archivo: tipo, tamaño y la firma "%PDF-" al comienzo.
// Devuelve el texto del error, o null si el archivo se puede leer.
export async function checkDebtFile(file: File): Promise<string | null> {
  const named = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!named) return DEBT_TEXT.errors.notPdf
  if (file.size === 0) return DEBT_TEXT.errors.empty
  if (file.size > MAX_BYTES) return DEBT_TEXT.errors.tooBig
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  const text = String.fromCharCode(...head)
  return text.includes('%PDF-') ? null : DEBT_TEXT.errors.notPdf
}

// Todos los textos fijos de la vista, para la prueba que revisa el lenguaje.
export function allDebtTexts(): string[] {
  const values: string[] = []
  for (const value of Object.values(DEBT_TEXT)) {
    if (typeof value === 'string') values.push(value)
    else if (typeof value === 'function') values.push(String((value as (...args: unknown[]) => string)(2, 2, '84 KB', '27-10-2026', '14:30')))
    else if (Array.isArray(value)) for (const item of value) values.push(typeof item === 'string' ? item : `${item.label} ${item.text}`)
    else values.push(...(Object.values(value) as string[]))
  }
  return values
}
