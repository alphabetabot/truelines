import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Auth({ onAuth = () => {} }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
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
            emailRedirectTo: 'https://trueoddsiq.com/login',
            data: { newsletter_opt_in: newsletter },
          },
        })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm your account, then log in.')
        setMode('login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data?.user) { onAuth(data.user); navigate('/picks') }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#f0f4f8' }}>

      {/* Logo */}
      <div className="mb-8 text-center">
        <img src="/logo.jpg" alt="TrueOddsIQ" style={{ height: 60, width: 'auto', margin: '0 auto 12px' }} />
        <p className="text-sm" style={{ color: '#64748b' }}>
          {mode === 'login' ? 'Sign in to access AI Picks' : 'Create your free account'}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid #e2e8f0' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                background: mode === m ? '#0f172a' : '#fff',
                color: mode === m ? '#fff' : '#64748b',
              }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#94a3b8' }}>
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
                <span className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                  ✉️ Yes! Send me the daily AI Picks newsletter with top picks, analysis, and line value alerts.
                </span>
              </label>

              {/* Disclaimer */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <input type="checkbox" checked={disclaimer} onChange={e => setDisclaimer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600" />
                <span className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
                  ⚠️ I understand that AI picks and analysis are for informational purposes only.
                  TrueOddsIQ is not liable for any wagers placed based on content on this site.
                  All betting is at my own risk. I am 21+ and in a legal betting jurisdiction. <strong>(Required)</strong>
                </span>
              </label>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="p-3 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl text-xs" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? '#e2e8f0' : '#0f172a',
              color: loading ? '#94a3b8' : '#fff',
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
            className="w-full text-center mt-3 text-xs" style={{ color: '#2563eb' }}>
            Forgot password?
          </button>
        )}
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: '#94a3b8' }}>
        Must be 21+ · For informational use only · <a href="/disclaimer" style={{ color: '#2563eb' }}>Disclaimer</a>
      </p>
    </div>
  )
}
