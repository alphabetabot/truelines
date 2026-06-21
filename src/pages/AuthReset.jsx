import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getAuthErrorMessage } from '../lib/authErrors'
import LogoLink from '../components/LogoLink'

export default function AuthReset() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const hash = window.location.hash || ''
      const isRecovery = hash.includes('type=recovery') || hash.includes('access_token')

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (!cancelled) {
          setReady(true)
          setChecking(false)
        }
        return
      }

      if (isRecovery) {
        await new Promise(r => setTimeout(r, 400))
        const { data: { session: retry } } = await supabase.auth.getSession()
        if (!cancelled) {
          setReady(Boolean(retry))
          setChecking(false)
          if (!retry) setError('This reset link is invalid or has expired. Request a new one from the sign-in page.')
        }
        return
      }

      if (!cancelled) {
        setChecking(false)
        setError('Open the password reset link from your email to continue.')
      }
    }

    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
        setChecking(false)
        setError(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setSuccess('Password updated. Sign in with your new password.')
      setTimeout(() => navigate('/login', { state: { resetSuccess: true } }), 1500)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="mb-8 text-center">
        <LogoLink height={60} maxWidth={280} style={{ margin: '0 auto 12px', justifyContent: 'center' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose a new password for your account</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {checking && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Verifying reset link…</p>
          </div>
        )}

        {!checking && !ready && (
          <div className="text-center py-4">
            {error && (
              <p className="text-sm mb-4 p-3 rounded-xl" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}
            <Link to="/login" className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
          </div>
        )}

        {!checking && ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--odds-bg)', color: 'var(--text-primary)' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: '1.5px solid var(--border)', background: 'var(--odds-bg)', color: 'var(--text-primary)' }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--odds-bg-best)', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: loading ? 'var(--border)' : 'var(--gold)',
                color: loading ? 'var(--text-muted)' : 'var(--text-on-cta)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
        <Link to="/login" style={{ color: 'var(--accent)' }}>Back to sign in</Link>
      </p>
    </div>
  )
}
