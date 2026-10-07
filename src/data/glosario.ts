export interface GlossaryTerm {
  term: string
  meaning: string
}

// Términos generales. La definición de cada cálculo vive en el registro de cálculos.
export const glossary: GlossaryTerm[] = [
  {
    term: 'Año tributario (AT)',
    meaning: 'El año en que se declara. En el AT 2025 se declara lo ganado durante 2024.',
  },
  {
    term: 'Formulario 22 (F22)',
    meaning: 'La declaración anual de renta que se presenta en abril ante el SII.',
  },
  {
    term: 'Formulario 29 (F29)',
    meaning: 'La declaración mensual de IVA, pagos provisionales y retenciones.',
  },
  {
    term: 'Formulario 50 (F50)',
    meaning: 'Declaración mensual de otros impuestos, como retenciones a no residentes.',
  },
  {
    term: 'Código',
    meaning: 'El número con que el SII identifica cada casilla de un formulario.',
  },
  {
    term: 'Folio',
    meaning: 'El número que identifica una declaración presentada.',
  },
  {
    term: 'UTA',
    meaning: 'Unidad Tributaria Anual. Medida del SII cuyo valor en pesos cambia cada año.',
  },
  {
    term: 'UF',
    meaning: 'Unidad de Fomento. Se reajusta a diario con la inflación; es la unidad habitual de los créditos hipotecarios.',
  },
  {
    term: 'Enajenación',
    meaning: 'El precio al que se compró una propiedad, según la inscripción.',
  },
  {
    term: 'Avalúo fiscal',
    meaning: 'El valor que el SII asigna a una propiedad para calcular las contribuciones.',
  },
]
