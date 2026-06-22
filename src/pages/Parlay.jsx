import { useEffect, useState } from 'react'
import { Layers, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { buildAiParlay, fetchParlayUsage, PARLAY_DAILY_LIMIT } from '../lib/parlayApi'
import {
  combineParlayAmericanOdds,
  formatAmericanOdds,
  parlayPayout,
} from '../lib/parlayMath'
import BuildYourOwnParlay from '../components/BuildYourOwnParlay'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"

const PARLAY_TABS = [
  { id: 'ai', label: 'AI Parlay' },
  { id: 'own', label: 'Build Your Own' },
]

const PARLAY_SPORTS = [
  { key: 'all', label: 'ALL' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'soccer_fifa_world_cup', label: 'World Cup' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF' },
  { key: 'basketball_ncaab', label: 'NCAA M Basketball' },
]

const LEG_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 2)

const selectStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '2px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 18,
  fontWeight: 700,
}

export default function Parlay() {
  const [activeTab, setActiveTab] = useState('ai')
  const [sport, setSport] = useState('all')
  const [legs, setLegs] = useState(3)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchParlayUsage()
      .then(u => { if (!cancelled) setUsage(u) })
      .catch(() => { if (!cancelled) setUsage(null) })
      .finally(() => { if (!cancelled) setUsageLoading(false) })
    return () => { cancelled = true }
  }, [])

  const atDailyLimit = usage != null && usage.remaining <= 0

  async function runBuild(regenerate = false) {
    if (atDailyLimit) {
      setError(`You've used all ${PARLAY_DAILY_LIMIT} AI parlays for today. Come back tomorrow.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const previousMatchups = regenerate && ticket?.legs
        ? ticket.legs.map(l => l.matchup)
        : []
      const result = await buildAiParlay({
        sport,
        legs,
        regenerate,
        previousMatchups,
      })
      setTicket(result)
      if (result.usage) setUsage(result.usage)
    } catch (err) {
      if (err.usage) setUsage(err.usage)
      setError(err.message || 'Could not build parlay')
    } finally {
      setLoading(false)
    }
  }

  const combined = ticket?.legs ? combineParlayAmericanOdds(ticket.legs.map(l => l.american)) : null
  const payout25 = ticket?.legs ? parlayPayout(25, ticket.legs.map(l => l.american)) : 0
  const ticketDate = ticket?.generatedAt
    ? new Date(ticket.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  function copyParlay() {
    if (!ticket?.legs?.length) return
    const lines = ticket.legs.map((leg, i) => `${i + 1}. ${leg.pick} — ${leg.matchup} (${leg.bet})`)
    const text = [
      `TrueOddsIQ ${ticket.legCount}-Leg ${ticket.sport} Parlay`,
      ...lines,
      combined != null ? `Combined (est.): ${formatAmericanOdds(combined)}` : '',
      '',
      'Illustrative only — not a bet slip.',
    ].filter(Boolean).join('\n')
    navigator.clipboard?.writeText(text)
  }

  return (
    <div className="max-w-xl mx-auto pb-12">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={24} style={{ color: 'var(--gold)' }} />
          <h1 className="text-2xl font-black uppercase" style={{ fontFamily: TEAM_FONT, color: 'var(--text-primary)' }}>
            Parlay Builder
          </h1>
        </div>
        <p className="font-semibold leading-relaxed" style={{ fontSize: 17, color: 'var(--text-muted)' }}>
          Let Vega build a ticket from today&apos;s odds — or build your own from DraftKings lines.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {PARLAY_TABS.map(tab => {
          const isActive = activeTab === tab.id
          const isAi = tab.id === 'ai'
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="py-3 rounded-xl font-extrabold text-sm sm:text-base transition-all"
              style={{
                background: isActive
                  ? (isAi ? 'var(--gold)' : 'var(--green)')
                  : 'var(--bg-card)',
                color: isActive ? 'var(--text-on-cta)' : '#fafafa',
                fontWeight: 800,
                border: `2px solid ${isActive ? (isAi ? 'var(--gold)' : 'var(--green)') : 'var(--border)'}`,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'ai' && (
        <>
          <div
            className="rounded-2xl p-6 sm:p-8 mb-6"
            style={{ background: 'var(--bg-card)', border: '2px solid var(--gold)', opacity: atDailyLimit ? 0.72 : 1 }}
          >
            <label className="block mb-2 font-bold uppercase text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
              Sport
            </label>
            <select
              value={sport}
              onChange={e => { setSport(e.target.value); setTicket(null); setError('') }}
              style={{ ...selectStyle, marginBottom: 20 }}
            >
              {PARLAY_SPORTS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <label className="block mb-2 font-bold uppercase text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
              How many legs?
            </label>
            <select
              value={legs}
              onChange={e => { setLegs(Number(e.target.value)); setTicket(null); setError('') }}
              style={{ ...selectStyle, marginBottom: 24 }}
            >
              {LEG_OPTIONS.map(n => (
                <option key={n} value={n}>{n} legs</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => runBuild(false)}
              disabled={loading || atDailyLimit || usageLoading}
              className="w-full py-4 rounded-xl font-extrabold flex items-center justify-center gap-2"
              style={{
                background: loading || atDailyLimit ? 'var(--border)' : 'var(--gold)',
                color: loading || atDailyLimit ? 'var(--text-muted)' : 'var(--text-on-cta)',
                fontSize: 18,
                cursor: loading || atDailyLimit ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Building your {legs}-leg parlay…
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Build Parlay with AI
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              className="rounded-xl p-4 mb-6 font-semibold text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          {!ticket && !loading && !error && (
            <p className="text-center font-semibold mb-6" style={{ fontSize: 16, color: 'var(--text-muted)' }}>
              Choose a sport (or ALL for mixed-sport parlays), pick leg count, then tap Build Parlay with AI.
            </p>
          )}

          {ticket?.legs?.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--green-border)' }}>
              <div
                className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--gold)', borderBottom: '2px solid var(--gold)' }}
              >
                <h2 className="font-black uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 20, color: 'var(--text-primary)' }}>
                  Your {ticket.legCount}-leg parlay
                </h2>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ticketDate}</span>
              </div>

              <div className="px-5 sm:px-6 py-5" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <p className="text-xs font-bold uppercase mb-4" style={{ color: 'var(--gold)' }}>
                  {ticket.sport}
                </p>
                <ol className="space-y-5">
                  {ticket.legs.map((leg, i) => (
                    <li key={`${leg.matchup}-${leg.pick}`} className="flex gap-4">
                      <span
                        className="font-black shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--gold)', color: 'var(--text-primary)', fontSize: 16 }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        {leg.sport && (
                          <span
                            className="inline-block text-xs font-bold uppercase px-2 py-0.5 rounded mb-1"
                            style={{ background: 'rgba(245,184,0,0.2)', color: 'var(--gold)' }}
                          >
                            {leg.sport}
                          </span>
                        )}
                        <p className="font-bold text-lg">{leg.pick}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{leg.matchup}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: 'var(--green-live)' }}>{leg.bet}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {combined != null && (
                  <div
                    className="mt-6 pt-5 grid sm:grid-cols-2 gap-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--gold)' }}>Combined (est.)</p>
                      <p className="text-3xl font-black" style={{ color: 'var(--green-live)', fontFamily: TEAM_FONT }}>
                        {formatAmericanOdds(combined)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--gold)' }}>$25 pays</p>
                      <p className="text-3xl font-black" style={{ color: 'var(--green-live)', fontFamily: TEAM_FONT }}>
                        ${payout25.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 sm:px-6 py-5 space-y-3" style={{ background: 'var(--gold-dim)' }}>
                <button
                  type="button"
                  onClick={() => runBuild(true)}
                  disabled={loading || atDailyLimit}
                  className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--green-border)',
                    fontSize: 17,
                    opacity: loading || atDailyLimit ? 0.6 : 1,
                    cursor: loading || atDailyLimit ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={18} />
                  Generate New Parlay
                </button>
                <button
                  type="button"
                  onClick={copyParlay}
                  className="w-full py-3 rounded-xl font-semibold"
                  style={{ background: 'transparent', color: 'var(--accent)', fontSize: 15 }}
                >
                  Copy parlay text
                </button>
                <p className="text-center text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Illustrative odds only — not a real bet slip. Place wagers at a licensed sportsbook. 21+
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'own' && <BuildYourOwnParlay embedded />}
    </div>
  )
}
