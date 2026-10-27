// Genera informe-deudas-sintetico.pdf: un PDF de 2 páginas A4, sin datos reales, para las
// pruebas de la vista Informe de deudas. Uso: node e2e/fixtures/generar-pdf-sintetico.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pages = [1, 2].map((number) =>
  [
    'BT /F1 22 Tf 60 770 Td (Documento sintetico de prueba) Tj ET',
    'BT /F1 12 Tf 60 745 Td (Sin datos reales. Solo para las pruebas de interfaz.) Tj ET',
    `BT /F1 48 Tf 60 640 Td (Pagina ${number} de 2) Tj ET`,
    '0.06 0.24 0.26 RG 1.5 w 60 600 m 535 600 l S',
    ...[0, 1, 2, 3].map((row) => `0.8 0.83 0.82 RG 0.8 w 60 ${560 - row * 40} m 535 ${560 - row * 40} l S`),
    ...[0, 1, 2].map((row) => `BT /F1 12 Tf 60 ${532 - row * 40} Td (Fila de ejemplo ${row + 1}) Tj ET`),
  ].join('\n'),
)

const objects = []
const add = (body) => objects.push(body) // devuelve el número de objeto
add('<< /Type /Catalog /Pages 2 0 R >>')
const kids = pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')
add(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
pages.forEach((content, index) => {
  add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`)
  add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
})

let pdf = '%PDF-1.4\n'
const offsets = objects.map((body, index) => {
  const offset = Buffer.byteLength(pdf)
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  return offset
})
const xref = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

writeFileSync(fileURLToPath(new URL('./informe-deudas-sintetico.pdf', import.meta.url)), pdf)
