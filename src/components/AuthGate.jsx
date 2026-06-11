import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function AuthGate({
  children,
  title = 'Free account required',
  description = 'Create a free account to build AI parlays. You also get the morning newsletter, live odds, and our public tracker.',
  from = '/parlay',
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-semibold" style={{ color: '#475569' }}>Loading…</p>
      </div>
    )
  }

  if (user) return children

  return (
    <div className="max-w-lg mx-auto py-10 px-6 text-center">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}
      >
        <UserPlus size={24} style={{ color: '#f59e0b' }} />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>
        Sign up free
      </p>
      <h1 className="text-2xl font-black mb-3" style={{ color: '#0f172a' }}>{title}</h1>
      <p className="text-sm leading-relaxed mb-6 font-semibold" style={{ color: '#0f172a' }}>
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/login"
          state={{ mode: 'signup', from }}
          className="px-6 py-3.5 rounded-xl text-sm font-bold"
          style={{ background: '#f59e0b', color: '#0f172a' }}
        >
          Create free account
        </Link>
        <Link
          to="/login"
          state={{ from }}
          className="px-6 py-3.5 rounded-xl text-sm font-bold"
          style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
        >
          Sign in
        </Link>
      </div>

      <p className="text-xs mt-8 font-semibold" style={{ color: '#475569' }}>
        Free · newsletter + odds tools · no credit card
      </p>
    </div>
  )
}
