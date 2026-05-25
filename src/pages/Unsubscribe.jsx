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
        const res = await fetch('/api/newsletter?action=unsubscribe', {
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
      <div className="rounded-2xl p-8" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <h1 className="text-2xl font-black mb-3" style={{ color: '#0f172a' }}>Email Preferences</h1>
        <p className="text-sm mb-6" style={{ color: status === 'error' ? '#dc2626' : '#475569' }}>
          {message}
        </p>
        <Link to="/" className="inline-block px-5 py-3 rounded-xl text-sm font-bold"
          style={{ background: '#0f172a', color: '#fff' }}>
          Back to TrueOddsIQ
        </Link>
      </div>
    </div>
  )
}
