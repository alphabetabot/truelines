import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash || ''
    const isRecovery = hash.includes('type=recovery')

    async function finish() {
      if (isRecovery) {
        navigate('/auth/reset', { replace: true })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const optedIn = session.user.user_metadata?.newsletter_opt_in === true
        if (optedIn) {
          await supabase.from('newsletter_subscribers').upsert({
            email: session.user.email,
            user_id: session.user.id,
            active: true,
          }, { onConflict: 'email', ignoreDuplicates: true })
        }
        trackEvent('login', { method: 'email', source: 'email_confirm' })
        navigate('/odds', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }

    finish()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        navigate('/auth/reset', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p style={{ color: '#64748b' }}>Completing sign in…</p>
      </div>
    </div>
  )
}
