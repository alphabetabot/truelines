import { AlertTriangle } from 'lucide-react'

export default function OddsLoadError({ title = 'Failed to load odds', message, onRetry }) {
  if (!message) return null

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl mb-4"
      style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
    >
      <AlertTriangle size={16} style={{ color: '#dc2626' }} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold underline"
            style={{ color: '#2563eb' }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
