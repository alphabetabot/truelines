import { useState } from 'react'
import { Layers, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { buildAiParlay } from '../lib/parlayApi'
import {
  combineParlayAmericanOdds,
  formatAmericanOdds,
  parlayPayout,
} from '../lib/parlayMath'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"

const PARLAY_SPORTS = [
  { key: 'all', label: 'ALL' },
  { key: 'baseball_mlb', label: 'MLB' },
  { key: 'basketball_nba', label: 'NBA' },
  { key: 'americanfootball_nfl', label: 'NFL' },
  { key: 'icehockey_nhl', label: 'NHL' },
  { key: 'americanfootball_ncaaf', label: 'NCAAF' },
  { key: 'basketball_ncaab', label: 'NCAA M Basketball' },
]

const LEG_OPTIONS = Array.from({ length: 9 }, (_, i) => i + 2)

const selectStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '2px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 700,
}

export default function Parlay() {
  const [sport, setSport] = useState('all')
  const [legs, setLegs] = useState(3)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runBuild(regenerate = false) {
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
    } catch (err) {
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
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={24} style={{ color: '#f59e0b' }} />
          <h1 className="text-2xl font-black uppercase" style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}>
            Parlay Builder
          </h1>
        </div>
        <p className="font-semibold leading-relaxed" style={{ fontSize: 18, color: '#0f172a' }}>
          Vega builds a parlay from today&apos;s real odds — for fun and research only.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 sm:p-8 mb-6"
        style={{ background: '#fff', border: '2px solid #f59e0b' }}
      >
        <label className="block mb-2 font-bold uppercase text-sm" style={{ color: '#0f172a', letterSpacing: '0.08em' }}>
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

        <label className="block mb-2 font-bold uppercase text-sm" style={{ color: '#0f172a', letterSpacing: '0.08em' }}>
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
          disabled={loading}
          className="w-full py-4 rounded-xl font-extrabold flex items-center justify-center gap-2"
          style={{
            background: loading ? '#e2e8f0' : '#f59e0b',
            color: loading ? '#64748b' : '#0f172a',
            fontSize: 18,
            cursor: loading ? 'not-allowed' : 'pointer',
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
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
        >
          {error}
        </div>
      )}

      {!ticket && !loading && !error && (
        <p className="text-center font-semibold" style={{ fontSize: 17, color: '#475569' }}>
          Choose a sport (or ALL for mixed-sport parlays), pick leg count, then tap Build Parlay with AI.
        </p>
      )}

      {ticket?.legs?.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #0f172a' }}>
          <div
            className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
            style={{ background: '#f59e0b', borderBottom: '2px solid #d97706' }}
          >
            <h2 className="font-black uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 20, color: '#0f172a' }}>
              Your {ticket.legCount}-leg parlay
            </h2>
            <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{ticketDate}</span>
          </div>

          <div className="px-5 sm:px-6 py-5" style={{ background: '#0f172a', color: '#fff' }}>
            <p className="text-xs font-bold uppercase mb-4" style={{ color: '#fbbf24' }}>
              {ticket.sport}
            </p>
            <ol className="space-y-5">
              {ticket.legs.map((leg, i) => (
                <li key={`${leg.matchup}-${leg.pick}`} className="flex gap-4">
                  <span
                    className="font-black shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#f59e0b', color: '#0f172a', fontSize: 16 }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    {leg.sport && (
                      <span
                        className="inline-block text-xs font-bold uppercase px-2 py-0.5 rounded mb-1"
                        style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}
                      >
                        {leg.sport}
                      </span>
                    )}
                    <p className="font-bold text-lg">{leg.pick}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#cbd5e1' }}>{leg.matchup}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#4ade80' }}>{leg.bet}</p>
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
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: '#fbbf24' }}>Combined (est.)</p>
                  <p className="text-3xl font-black" style={{ color: '#4ade80', fontFamily: TEAM_FONT }}>
                    {formatAmericanOdds(combined)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: '#fbbf24' }}>$25 pays</p>
                  <p className="text-3xl font-black" style={{ color: '#4ade80', fontFamily: TEAM_FONT }}>
                    ${payout25.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-3" style={{ background: '#fffbeb' }}>
            <button
              type="button"
              onClick={() => runBuild(true)}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{
                background: '#fff',
                color: '#0f172a',
                border: '2px solid #0f172a',
                fontSize: 17,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw size={18} />
              Generate New Parlay
            </button>
            <button
              type="button"
              onClick={copyParlay}
              className="w-full py-3 rounded-xl font-semibold"
              style={{ background: 'transparent', color: '#2563eb', fontSize: 15 }}
            >
              Copy parlay text
            </button>
            <p className="text-center text-sm font-semibold leading-relaxed" style={{ color: '#475569' }}>
              Illustrative odds only — not a real bet slip. Place wagers at a licensed sportsbook. 21+
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
