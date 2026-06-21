import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

export default function AIPicksExplainer({ sportLabel, pickSport }) {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/todays-pick')
        if (!res.ok) {
          if (!cancelled) setUnavailable(true)
          return
        }
        const data = await res.json()
        if (!cancelled) {
          if (!data?.bet || isPlaceholderBet(data.bet)) {
            setUnavailable(true)
          } else if (pickSport && data.sport !== pickSport) {
            setPick(null)
            setUnavailable(false)
          } else {
            setPick(data)
          }
        }
      } catch {
        if (!cancelled) setUnavailable(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pickSport])

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
        How Vega&apos;s {sportLabel ? `${sportLabel} ` : ''}picks work
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <p>
          Each morning (Pacific time) our system reviews the slate when games are available, compares odds across
          six books, and publishes up to three actionable bets — not fades or pass plays.
        </p>
        <p>
          Everyone sees a <strong>free top pick preview</strong> on the homepage. Premium unlocks all three picks
          on the AI Picks tab. Free accounts get one top pick in the morning newsletter and the public performance tracker.
        </p>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--gold)' }}>
          Today&apos;s pick snapshot
        </h3>
        {loading && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading pick data…</p>}
        {!loading && unavailable && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Picks are not available yet today. Check back after the morning run or view the{' '}
            <Link to="/picks" style={{ color: 'var(--gold)' }}>picks page</Link>.
          </p>
        )}
        {!loading && !unavailable && !pick && pickSport && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Today&apos;s featured pick is for another sport. The daily slate may still include {sportLabel} on other days — see{' '}
            <Link to="/picks" style={{ color: 'var(--gold)' }}>all picks</Link>.
          </p>
        )}
        {!loading && pick && (
          <>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{pick.game}</p>
            <p className="font-bold text-white mb-1">{pick.pick}</p>
            {pick.bet && <p className="text-xs mb-2" style={{ color: 'var(--gold)' }}>{pick.bet}</p>}
            {pick.edge && (
              <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                {pick.edge.length > 280 ? `${pick.edge.slice(0, 277)}…` : pick.edge}
              </p>
            )}
          </>
        )}
      </div>

      <Link to="/picks" className="inline-block mt-3 text-sm font-bold" style={{ color: 'var(--accent)' }}>
        Go to today&apos;s picks →
      </Link>
    </section>
  )
}
