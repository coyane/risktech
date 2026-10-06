import { Link } from 'react-router-dom'
import type { Proposal, ThreadMessage } from '../../types'
import { AgentPlan } from './AgentPlan'
import { RichText } from './RichText'

export function Avatar({ role }: { role: ThreadMessage['role'] }) {
  return (
    <div className={`msg-avatar ${role}`} aria-hidden="true">
      {role === 'agent' ? 'C' : 'Tú'}
    </div>
  )
}

export function Message({
  message,
  planOpen = false,
  onProposal,
}: {
  message: ThreadMessage
  planOpen?: boolean
  onProposal: (proposal: Proposal) => void
}) {
  const time = new Date(message.at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`msg ${message.role}`}>
      <Avatar role={message.role} />
      <div className="msg-content">
        <span className="sr-only">{message.role === 'agent' ? 'Agente: ' : 'Tú: '}</span>
        {message.plan && (
          <AgentPlan title={message.plan.title} steps={message.plan.steps} defaultOpen={planOpen} />
        )}
        <div className={`msg-bubble${message.fallback ? ' fallback' : ''}`}>
          <p>
            <RichText text={message.text} />
          </p>
          {message.table && (
            <div className="table-wrap msg-table">
              <table>
                <thead>
                  <tr>
                    {message.table.head.map((cell) => (
                      <th key={cell}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.table.rows.map((row) => (
                    <tr key={row.join('|')}>
                      {row.map((cell, index) => (
                        <td key={index}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {message.cites && message.cites.length > 0 && (
            <div className="msg-cites">
              <span className="msg-cites-label">Respaldo</span>
              {message.cites.map((cite) =>
                cite.anchor ? (
                  <Link key={cite.label} className="cite" to={`/numeros#${cite.anchor}`}>
                    {cite.label}
                  </Link>
                ) : (
                  <span key={cite.label} className="cite">
                    {cite.label}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
        {message.proposal && (
          <div className="proposal">
            <span className="proposal-tag">{message.proposal.tag}</span>
            <p>{message.proposal.text}</p>
            {message.proposal.action.kind === 'link' ? (
              <Link className="btn btn-primary btn-sm" to={message.proposal.action.to}>
                {message.proposal.label}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onProposal(message.proposal!)}
              >
                {message.proposal.label}
              </button>
            )}
          </div>
        )}
        <div className="msg-time">{time}</div>
      </div>
    </div>
  )
}
