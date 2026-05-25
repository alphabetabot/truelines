import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function getRecoveryTarget() {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('next') === '/reset-password' || hash.get('type') === 'recovery'
}

async function getCallbackSession() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    if (data.session) return data.session
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const isRecovery = getRecoveryTarget()

  useEffect(() => {
    let active = true

    async function handleCallback() {
      try {
        const session = await getCallbackSession()
        if (!active) return

        if (session?.user) {
          if (isRecovery) {
            navigate('/reset-password', { replace: true })
            return
          }

          const optedIn = session.user.user_metadata?.newsletter_opt_in === true
          if (optedIn) {
            await supabase.from('newsletter_subscribers').upsert({
              email: session.user.email,
              user_id: session.user.id,
              active: true,
            }, { onConflict: 'email', ignoreDuplicates: true })
          }
          navigate('/picks', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      } catch (e) {
        if (active) setError(e.message)
      }
    }

    handleCallback()
    return () => {
      active = false
    }
  }, [isRecovery, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="font-semibold mb-2" style={{ color: '#dc2626' }}>Sign-in link failed</p>
            <p className="text-sm mb-4" style={{ color: '#64748b' }}>{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: '#0f172a', color: '#fff' }}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p style={{ color: '#64748b' }}>
              {isRecovery ? 'Preparing password reset...' : 'Signing you in...'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
