import { useState, useEffect } from 'react'

export function usePickPerformanceData() {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPicks() {
      setError(null)
      try {
        const res = await fetch('/api/performance-picks')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Tracker unavailable (${res.status})`)
        }
        const data = await res.json()
        if (!cancelled) setPicks(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load pick tracker')
          setPicks([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPicks()
    return () => { cancelled = true }
  }, [])

  return { picks, loading, error }
}
