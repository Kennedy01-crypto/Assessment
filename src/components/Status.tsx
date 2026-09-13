import { RefreshCw } from 'lucide-react'

type StatusProps = {
  kind: 'loading' | 'empty' | 'error'
  message: string
  onRetry?: () => void
}

export function Status({ kind, message, onRetry }: StatusProps) {
  return (
    <div className={`state state-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <div className="state-icon">
        {kind === 'error' ? '!' : kind === 'empty' ? '—' : <RefreshCw className="spin" size={22} />}
      </div>
      <strong>{message}</strong>
      {kind === 'error' && onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
