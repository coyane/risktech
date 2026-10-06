import { useState, type FormEvent, type ReactNode } from 'react'

export function AskForm({
  id,
  label,
  placeholder,
  onAsk,
  children,
}: {
  id: string
  label: string
  placeholder: string
  onAsk: (question: string) => void
  children?: ReactNode
}) {
  const [question, setQuestion] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const q = question.trim()
    if (!q) return
    onAsk(q)
    setQuestion('')
  }

  return (
    <form className="card ask-form" onSubmit={onSubmit}>
      <div className="ask-row">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          className="ask-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" className="btn btn-dark">
          Preguntar
        </button>
      </div>
      {children}
    </form>
  )
}
