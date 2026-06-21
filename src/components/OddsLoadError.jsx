import { AlertTriangle } from 'lucide-react'

export default function OddsLoadError({ title = 'Failed to load odds', message, onRetry }) {
  if (!message) return null

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl mb-4"
      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
    >
      <AlertTriangle size={16} style={{ color: '#fca5a5' }} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: '#fca5a5' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold underline"
            style={{ color: 'var(--accent)' }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
