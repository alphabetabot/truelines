import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth/email confirmation callback
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Ensure user is in newsletter_subscribers (in case signup insert failed)
        await supabase.from('newsletter_subscribers').upsert({
          email: session.user.email,
          user_id: session.user.id,
          active: true,
        }, { onConflict: 'email', ignoreDuplicates: true })
        navigate('/picks')
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p style={{ color: '#64748b' }}>Signing you in...</p>
      </div>
    </div>
  )
}
