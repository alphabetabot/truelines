import { useEffect, useState } from 'react'

export function usePickPerformance() {
  const [stats, setStats] = useState({
    loading: true,
    error: null,
    wins: 0,
    losses: 0,
    winRate: null,
    totalUnits: 0,
    gradedCount: 0,
    hasRecord: false,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/performance-picks')
        if (!res.ok) throw new Error('Tracker unavailable')
        const picks = await res.json()
        if (cancelled) return

        const graded = Array.isArray(picks) ? picks.filter(p => p.result && p.result !== '') : []
        const wins = graded.filter(p => p.result === 'W').length
        const losses = graded.filter(p => p.result === 'L').length
        const totalUnits = graded.reduce((s, p) => s + (parseFloat(p.units) || 0), 0)

        setStats({
          loading: false,
          error: null,
          wins,
          losses,
          winRate: graded.length ? Math.round((wins / graded.length) * 100) : null,
          totalUnits,
          gradedCount: graded.length,
          hasRecord: graded.length > 0,
        })
      } catch (e) {
        if (!cancelled) {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: e.message,
            hasRecord: false,
          }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return stats
}
