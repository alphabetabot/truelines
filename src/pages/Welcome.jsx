import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { briefEdgeSummary } from '../lib/pickText'
import { trackEvent } from '../lib/analytics'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

const FREE_ROWS = [
  ['3 daily picks', 'Short summary'],
  ['Live odds', '6 books'],
  ['Public tracker', 'W–L graded'],
  ['Newsletter', 'Morning email'],
]

const PREMIUM_FEATURES = [
  {
    title: 'In-depth pick reports',
    detail: 'Stats, injury updates, weather, and line context on every play — the full handicapper breakdown.',
  },
  {
    title: 'Unlimited AI analysis',
    detail: 'Run deep research on any game on the board, not just our three picks.',
  },
  {
    title: 'Closing line value (CLV)',
    detail: 'See whether you\'re beating the closing number — the metric pros care about most.',
  },
]

const POWERS = [
  { title: 'Real-time odds', tag: 'LIVE', text: 'Six major sportsbooks, updated continuously.' },
  { title: 'Best-line value', tag: 'LIVE', text: 'We surface the number worth betting, not noise.' },
  { title: 'Vega AI analysis', tag: 'LIVE', text: 'Picks built from real data — never invented stats.' },
  { title: 'Public track record', tag: 'LIVE', text: 'Every pick graded to the game date.' },
  { title: 'Injury & weather depth', tag: 'Premium', text: 'Full reports for subscribers.' },
  { title: 'Line movement & CLV', tag: 'Rolling out', text: 'Closing line value tracking for Premium.' },
]

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

function scrollToPick() {
  document.getElementById('todays-pick')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Welcome() {
  const navigate = useNavigate()
  const perf = usePickPerformance()
  const [pick, setPick] = useState(null)
  const [pickLoading, setPickLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/todays-pick')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.bet && !isPlaceholderBet(data.bet)) {
          setPick(data)
        }
      } catch {
        // preview optional when picks not ready
      } finally {
        if (!cancelled) setPickLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function ctaSignup(source) {
    trackEvent('welcome_cta', { action: 'signup', source })
    navigate('/login')
  }

  const recordLabel = perf.hasRecord && !perf.error
    ? `${perf.wins}–${perf.losses}`
    : '—'
  const unitsLabel = perf.hasRecord && !perf.error
    ? `${perf.totalUnits > 0 ? '+' : ''}${perf.totalUnits.toFixed(2)}u`
    : '—'
  const gradedLabel = perf.hasRecord && !perf.error ? `${perf.gradedCount} picks` : '—'

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      {/* Hero */}
      <header
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #0a0f1a 0%, #0f172a 45%, #1a2332 100%)',
          color: '#fff',
          margin: '0 -1rem',
          padding: '48px 1.5rem 56px',
        }}
      >
        <div className="max-w-2xl mx-auto relative z-10">
          <p className="text-xs font-bold uppercase mb-4" style={{ color: '#f59e0b', letterSpacing: '0.2em' }}>
            Vega · Daily AI Picks
          </p>
          <h1
            className="font-black leading-tight mb-4"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(2rem, 6vw, 3.25rem)',
            }}
          >
            Smarter bets start with
            <em
              className="block not-italic"
              style={{ color: '#fbbf24', fontWeight: 500, fontStyle: 'italic', fontSize: '0.92em', marginTop: 4 }}
            >
              better data.
            </em>
          </h1>
          <p className="text-base mb-7" style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 520 }}>
            <strong style={{ color: '#fff' }}>Three picks every morning.</strong> Graded in public. Real odds from six books — no tout hype.
          </p>

          <div
            className="flex flex-wrap gap-5 sm:gap-8 mb-8 pb-7"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { label: 'Record', val: recordLabel, color: '#4ade80' },
              { label: 'Units', val: unitsLabel, color: '#4ade80' },
              { label: 'Graded', val: gradedLabel, color: '#fbbf24' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <span className="block text-[10px] uppercase font-bold mb-0.5" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
                  {label}
                </span>
                <Link
                  to="/picks"
                  className="font-bold text-xl hover:underline"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", color }}
                >
                  {perf.loading ? '…' : val}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => ctaSignup('hero_primary')}
              className="px-7 py-3.5 rounded-xl font-bold text-sm"
              style={{ background: '#f59e0b', color: '#0f172a' }}
            >
              Get today&apos;s full card — free
            </button>
            <button
              type="button"
              onClick={scrollToPick}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              See today&apos;s pick ↓
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* About + pick preview */}
        <section className="py-10">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#94a3b8', letterSpacing: '0.18em', fontFamily: "'Fraunces', Georgia, serif" }}>
            TrueOddsIQ
          </p>
          <h2
            className="font-black text-2xl sm:text-3xl mb-4"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#0f172a' }}
          >
            Pro research. <em style={{ fontStyle: 'italic', fontWeight: 500, color: '#b45309' }}>Clear</em> picks.
          </h2>
          <p className="text-base leading-relaxed mb-2" style={{ color: '#475569' }}>
            Here at <strong style={{ color: '#0f172a' }}>TrueOddsIQ</strong>, we deliver full analysis and top daily picks using the same metrics
            professional sports handicappers rely on — <em style={{ color: '#64748b' }}>and then some.</em> Deciding who or what to bet on can be
            overwhelming. <strong style={{ color: '#0f172a' }}>Let us do the research</strong>, take the stress out of your morning slate, and
            save you valuable time.
          </p>

          <p
            id="todays-pick"
            className="text-xs font-bold uppercase mt-10 mb-4"
            style={{ color: '#f59e0b', letterSpacing: '0.16em' }}
          >
            Today&apos;s top pick · preview
          </p>

          {pickLoading && (
            <div className="rounded-2xl mb-3 animate-pulse" style={{ background: '#0f172a', height: 160 }} />
          )}

          {!pickLoading && pick && (
            <div className="rounded-2xl p-6 mb-3 text-white" style={{ background: '#0f172a' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ background: (sportColor[pick.sport] || '#64748b') + '33', color: sportColor[pick.sport] || '#64748b' }}>
                  {pick.sport}
                </span>
                <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>TOP PICK</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{pick.game}</p>
              <p className="font-black text-xl mb-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{pick.pick}</p>
              <p className="text-sm italic mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {briefEdgeSummary(pick.edge)}
              </p>
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>{pick.bet}</p>
            </div>
          )}

          {!pickLoading && !pick && (
            <div className="rounded-xl p-6 mb-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>Picks publish every morning</p>
              <Link to="/picks" className="text-sm font-bold" style={{ color: '#2563eb' }}>View picks page →</Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            {[2, 3].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => ctaSignup(`locked_pick_${n}`)}
                className="rounded-2xl p-5 text-center w-full"
                style={{ background: '#fff', border: '1px dashed #cbd5e1', cursor: 'pointer' }}
              >
                <div className="text-2xl mb-2 opacity-50">🔒</div>
                <p className="text-sm font-bold" style={{ color: '#64748b' }}>
                  Pick #{n}
                  <span className="block font-normal text-xs mt-0.5">Free account</span>
                </p>
              </button>
            ))}
          </div>
          <p className="text-center text-sm" style={{ color: '#64748b' }}>
            <button type="button" onClick={() => ctaSignup('unlock_note')} className="font-bold underline" style={{ color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer' }}>
              Free account
            </button>
            {' '}unlocks the full card + newsletter. No credit card.
          </p>
        </section>

        {/* Free vs Premium */}
        <section className="py-8">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#94a3b8', letterSpacing: '0.18em', fontFamily: "'Fraunces', Georgia, serif" }}>
            Compare
          </p>
          <h2 className="font-black text-2xl sm:text-3xl mb-6" style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#0f172a' }}>
            Free <em style={{ fontStyle: 'italic', fontWeight: 500, color: '#b45309' }}>vs</em> Premium
          </h2>

          <div className="grid gap-5 sm:grid-cols-[0.85fr_1.2fr] items-start">
            <div
              className="rounded-2xl p-4"
              style={{ background: '#f8fafc', border: '2px solid #0f172a' }}
            >
              <h3 className="font-black text-lg mb-1" style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#0369a1' }}>
                Free account
              </h3>
              <p className="text-sm font-semibold mb-4" style={{ color: '#0ea5e9' }}>$0</p>
              <div className="rounded-lg overflow-hidden" style={{ border: '2px solid #0f172a', background: '#fff' }}>
                <table className="w-full border-collapse" style={{ fontSize: 14, fontWeight: 700 }}>
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="text-left px-3 py-2 text-xs uppercase"
                        style={{ background: '#0f172a', color: '#fff', letterSpacing: '0.06em' }}
                      >
                        Included
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FREE_ROWS.map(([feature, detail], i) => (
                      <tr key={feature} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                        <td className="px-3 py-2 border-b border-slate-100" style={{ color: '#0f172a', width: '42%' }}>
                          {feature}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 text-sm" style={{ color: '#475569', fontWeight: 600 }}>
                          {detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => ctaSignup('free_tier')}
                className="w-full mt-4 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: '#0f172a', color: '#fff' }}
              >
                Create free account
              </button>
            </div>

            <div
              className="rounded-2xl p-5 relative"
              style={{
                background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 100%)',
                border: '2px solid #f59e0b',
                boxShadow: '0 12px 40px rgba(245, 158, 11, 0.18)',
                color: '#fff',
              }}
            >
              <span
                className="absolute -top-2.5 right-4 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md"
                style={{ background: '#f59e0b', color: '#0f172a', letterSpacing: '0.1em' }}
              >
                Best value
              </span>
              <h3 className="font-black text-xl mb-1" style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#fbbf24' }}>
                Premium
              </h3>
              <p className="font-bold text-lg mb-4" style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#fde68a' }}>
                $19.95 / month
              </p>
              <p className="font-bold text-base mb-4 text-white">
                Everything in free account, plus
              </p>
              {PREMIUM_FEATURES.map(f => (
                <div
                  key={f.title}
                  className="rounded-xl p-3.5 mb-2.5 last:mb-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                >
                  <strong className="block text-sm font-bold text-white mb-1">{f.title}</strong>
                  <span className="text-xs italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{f.detail}</span>
                </div>
              ))}
              <Link
                to="/premium"
                onClick={() => trackEvent('welcome_cta', { action: 'premium' })}
                className="block w-full mt-4 py-3 rounded-lg text-center text-sm font-extrabold"
                style={{ background: '#f59e0b', color: '#0f172a' }}
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </section>

        {/* Methodology */}
        <section className="py-8">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#94a3b8', letterSpacing: '0.18em', fontFamily: "'Fraunces', Georgia, serif" }}>
            Methodology
          </p>
          <h2 className="font-black text-2xl sm:text-3xl mb-6" style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#0f172a' }}>
            What <em style={{ fontStyle: 'italic', fontWeight: 500, color: '#b45309' }}>powers</em> our picks
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {POWERS.map(p => (
              <div key={p.title}>
                <h4 className="text-sm font-bold mb-1" style={{ color: '#0f172a' }}>
                  {p.title}
                  <span
                    className="ml-2 text-[10px] font-bold uppercase"
                    style={{ color: p.tag === 'LIVE' ? '#16a34a' : '#94a3b8', fontStyle: p.tag === 'LIVE' ? 'normal' : 'italic' }}
                  >
                    {p.tag}
                  </span>
                </h4>
                <p className="text-sm" style={{ color: '#64748b' }}>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs leading-relaxed pb-10" style={{ color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>Sign in</Link>
          {' · '}
          <Link to="/picks" className="font-semibold" style={{ color: '#2563eb' }}>Today&apos;s picks</Link>
          {' · '}
          <Link to="/premium" className="font-semibold" style={{ color: '#2563eb' }}>Premium</Link>
          {' · '}
          <Link to="/disclaimer" className="font-semibold" style={{ color: '#2563eb' }}>Disclaimer</Link>
        </p>
      </div>
    </div>
  )
}
