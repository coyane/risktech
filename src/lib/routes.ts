// Rutas de la vista cliente, en un solo lugar para que los enlaces no se desalineen.
export const REPORT_PATH = '/diagnostico'
export const ANALYSIS_PATH = '/analisis'

export const reportAnchor = (id: string) => `${REPORT_PATH}#${id}`
