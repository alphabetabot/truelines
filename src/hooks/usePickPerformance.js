import { useEffect, useState } from 'react'
import { aggregatePickPerformance, filterPicksByPeriod } from '../lib/pickPerformance'

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

        const graded = Array.isArray(picks)
          ? filterPicksByPeriod(picks.filter(p => p.result && p.result !== ''), 'since_july')
          : []
        const agg = aggregatePickPerformance(graded, { includeByRecommendation: false })
        const wins = agg.wins
        const losses = agg.losses
        const totalUnits = agg.totalUnits

        setStats({
          loading: false,
          error: null,
          wins,
          losses,
          winRate: agg.decided > 0 ? agg.winRate : null,
          totalUnits,
          gradedCount: agg.count,
          hasRecord: agg.count > 0,
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
