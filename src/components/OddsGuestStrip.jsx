import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function OddsGuestStrip() {
  const { user, loading } = useAuth()

  if (loading || user) return null

  return (
    <div
      className="mb-3 px-3 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
        Compare live sportsbook odds, AI picks, and line movement.{' '}
        <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
          Create a free account
        </Link>{' '}
        to unlock additional features.
      </p>
    </div>
  )
}
