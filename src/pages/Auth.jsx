import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'
import { trackEvent } from '../lib/analytics'
import LogoLink from '../components/LogoLink'

export default function Auth({ onAuth = () => {} }) {
  const navigate = useNavigate()
  const location = useLocation()
  const initialMode = location.state?.mode === 'signup' || new URLSearchParams(location.search).has('signup')
    ? 'signup'
    : 'login'
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [newsletter, setNewsletter] = useState(true)
  const [disclaimer, setDisclaimer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'signup' && !disclaimer) {
      setError('You must agree to the disclaimer to create an account.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://trueoddsiq.com/auth/callback',
            data: { newsletter_opt_in: newsletter },
          },
        })
        if (error) throw error

        // Directly insert into newsletter_subscribers if opted in
        if (newsletter && data?.user) {
          await supabase.from('newsletter_subscribers').insert({
            email,
            user_id: data.user.id,
            active: true,
          }).then(() => {}) // ignore errors (duplicate etc)
        }

        trackEvent('sign_up', { method: 'email', newsletter_opt_in: newsletter })
        setSuccess('Account created! Check your email to confirm your account, then log in.')
        setMode('login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data?.user) {
          trackEvent('login', { method: 'email' })
          onAuth(data.user)
          navigate('/odds')
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        <LogoLink height={48} maxWidth={280} style={{ margin: '0 auto 12px', justifyContent: 'center' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login'
            ? 'Sign in for odds, newsletter, and tracker — Premium unlocks AI Picks & Analysis'
            : 'Free account — live odds, newsletter email, and public tracker'}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                background: mode === m ? 'var(--gold)' : 'var(--bg-card)',
                color: mode === m ? 'var(--text-on-cta)' : 'var(--text-muted)',
              }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid var(--border)', background: 'var(--odds-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                style={{ border: '1.5px solid var(--border)', background: 'var(--odds-bg)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign up extras */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-3">
              {/* Newsletter opt-in */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600" />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  ✉️ Yes! Send me the daily top pick newsletter with full analysis and line value alerts.
                <span className="block mt-1" style={{ fontSize: 16, color: 'var(--text-primary)' }}>📧 Using Outlook or Hotmail? Add picks@trueoddsiq.com to your contacts to ensure delivery.</span>
                </span>
              </label>

              {/* Disclaimer */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl"
                style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)' }}>
                <input type="checkbox" checked={disclaimer} onChange={e => setDisclaimer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600" />
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  ⚠️ I understand that AI picks and analysis are for informational purposes only.
                  TrueOddsIQ is not liable for any wagers placed based on content on this site.
                  All betting is at my own risk. I am 21+ and in a legal betting jurisdiction. <strong>(Required)</strong>
                </span>
              </label>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--odds-bg-best)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? 'var(--border)' : 'var(--gold)',
              color: loading ? 'var(--text-muted)' : 'var(--text-on-cta)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Forgot password */}
        {mode === 'login' && (
          <button onClick={async () => {
            if (!email) { setError('Enter your email first'); return }
            await supabase.auth.resetPasswordForEmail(email)
            setSuccess('Password reset email sent!')
          }}
            className="w-full text-center mt-3 text-xs" style={{ color: 'var(--accent)' }}>
            Forgot password?
          </button>
        )}
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Must be 21+ · For informational use only · <a href="/disclaimer" style={{ color: 'var(--accent)' }}>Disclaimer</a>
        {' '}· <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy</a>
        {' '}· <a href="/terms" style={{ color: 'var(--accent)' }}>Terms</a>
      </p>
    </div>
  )
}
