// Texto con **negritas**, como lo escribe el agente.
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
      )}
    </>
  )
}
