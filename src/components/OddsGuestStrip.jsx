import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function OddsGuestStrip() {
  const { user, loading } = useAuth()

  if (loading || user) return null

  return (
    <div
      className="mb-3 px-3 py-2 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <p className="text-xs leading-snug" style={{ color: '#64748b' }}>
        Compare live sportsbook odds, AI picks, and line movement.{' '}
        <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>
          Create a free account
        </Link>{' '}
        to unlock additional features.
      </p>
    </div>
  )
}
