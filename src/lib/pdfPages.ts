// Dibuja cada página de un PDF como imagen, sin extraer ni reinterpretar su contenido.
// Este módulo se carga solo cuando la persona carga un PDF (import dinámico): pdf.js y su
// worker no entran en el paquete inicial. Ver docs/decisions/0005-pdfjs-informe-de-deudas.md.
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfPageImage {
  src: string
  width: number
  height: number
}

export class PdfReadError extends Error {
  readonly reason: 'password' | 'unreadable' | 'tooManyPages'

  constructor(reason: 'password' | 'unreadable' | 'tooManyPages') {
    super(reason)
    this.reason = reason
  }
}

// Ancho máximo de cada imagen: nítida en pantalla y en el PDF impreso.
const TARGET_WIDTH = 1600
const MAX_SCALE = 2.5

export async function renderPdfPages(
  data: ArrayBuffer,
  maxPages: number,
  onProgress: (done: number, total: number) => void,
): Promise<PdfPageImage[]> {
  const task = getDocument({ data: new Uint8Array(data) })
  let pdf
  try {
    pdf = await task.promise
  } catch (error) {
    throw new PdfReadError(error instanceof Error && error.name === 'PasswordException' ? 'password' : 'unreadable')
  }

  const images: PdfPageImage[] = []
  try {
    if (pdf.numPages > maxPages) throw new PdfReadError('tooManyPages')
    onProgress(0, pdf.numPages)
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: Math.min(MAX_SCALE, TARGET_WIDTH / base.width) })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      page.cleanup()
      if (!blob) throw new PdfReadError('unreadable')
      images.push({ src: URL.createObjectURL(blob), width: canvas.width, height: canvas.height })
      onProgress(number, pdf.numPages)
    }
    return images
  } catch (error) {
    for (const image of images) URL.revokeObjectURL(image.src)
    throw error instanceof PdfReadError ? error : new PdfReadError('unreadable')
  } finally {
    void task.destroy()
  }
}
