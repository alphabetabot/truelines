import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Processing your unsubscribe request...')

  useEffect(() => {
    async function unsubscribe() {
      const email = params.get('email')
      const token = params.get('token')

      if (!email || !token) {
        setStatus('error')
        setMessage('This unsubscribe link is missing required information.')
        return
      }

      try {
        const res = await fetch('/api/picks-status?action=unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Unable to unsubscribe.')
        }
        setStatus('success')
        setMessage('You have been unsubscribed from TrueOddsIQ emails.')
      } catch (err) {
        setStatus('error')
        setMessage(err.message)
      }
    }

    unsubscribe()
  }, [params])

  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>Email Preferences</h1>
        <p className="text-sm mb-6" style={{ color: status === 'error' ? '#dc2626' : 'var(--text-muted)' }}>
          {message}
        </p>
        <Link to="/" className="inline-block px-5 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          Back to TrueOddsIQ
        </Link>
      </div>
    </div>
  )
}
