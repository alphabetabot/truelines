import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Welcome from './Welcome'

/** Homepage: landing for guests; signed-in users go to live odds. */
export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: '#64748b' }}>Loading…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/odds" replace />
  }

  return <Welcome />
}
