import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
        <div className="text-center">
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: '#2563eb' }} />
          <p className="text-sm" style={{ color: '#64748b' }}>Checking your reset link...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: '#f0f4f8' }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <img src="/logo.svg" alt="TrueOddsIQ" style={{ height: 56, width: 'auto', margin: '0 auto 16px' }} />
          <h1 className="text-xl font-black mb-2" style={{ color: '#0f172a' }}>Reset link expired</h1>
          <p className="text-sm mb-5" style={{ color: '#64748b' }}>
            Request a new password reset email, then open the latest link from your inbox.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: '#0f172a', color: '#fff' }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: '#f0f4f8' }}>
      <div className="mb-8 text-center">
        <img src="/logo.svg" alt="TrueOddsIQ" style={{ height: 60, width: 'auto', margin: '0 auto 12px' }} />
        <p className="text-sm" style={{ color: '#64748b' }}>Choose a new password for your account</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {success ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7', color: '#16a34a' }}>
              OK
            </div>
            <h1 className="text-xl font-black mb-2" style={{ color: '#0f172a' }}>Password updated</h1>
            <p className="text-sm mb-5" style={{ color: '#64748b' }}>Your new password is saved and you are signed in.</p>
            <button
              onClick={() => navigate('/picks', { replace: true })}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: '#0f172a', color: '#fff' }}
            >
              Continue to AI Picks
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                  style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? '#e2e8f0' : '#0f172a',
                color: loading ? '#94a3b8' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
