import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { briefEdgeSummary } from '../lib/pickText'
import { trackEvent } from '../lib/analytics'
import LogoLink from '../components/LogoLink'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"
const BODY = { fontSize: 18, color: '#0f172a', lineHeight: 1.55 }
const BODY_MUTED = { fontSize: 17, color: '#0f172a', lineHeight: 1.5 }
const SECTION_LABEL = { fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '0.14em', textTransform: 'uppercase' }
const CONTENT_PAD = 'px-5 sm:px-8 lg:px-12'
const CONTENT_MAX = 'max-w-4xl mx-auto w-full'

const FREE_TIER_ROWS = [
  { label: 'Daily newsletter', value: '1 top pick' },
  { label: 'Homepage', value: 'Top pick preview' },
  { label: 'Tools', value: 'Odds · Compare' },
  { label: 'Track record', value: 'Public tracker' },
]

const PREMIUM_FEATURES = [
  {
    title: 'Full AI Picks tab',
    detail: 'All 3 daily picks with full write-ups, confidence, and on-demand pick generation.',
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

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    <div className="w-full" style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <header
        className="relative overflow-hidden text-center w-full"
        style={{
          background: 'linear-gradient(165deg, #0a0f1a 0%, #0f172a 45%, #1a2332 100%)',
          color: '#fff',
          minHeight: 'min(92vh, 920px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '40px 0 56px',
        }}
      >
        <div className={`${CONTENT_MAX} ${CONTENT_PAD} relative z-10`}>
          <div className="flex justify-center mb-8">
            <LogoLink height={112} maxWidth={520} />
          </div>

          <h1
            className="font-black leading-tight mb-5 mx-auto"
            style={{
              fontSize: 'clamp(2.25rem, 9vw, 4.5rem)',
              letterSpacing: '-0.01em',
              color: '#fff',
              lineHeight: 1.08,
              maxWidth: 720,
            }}
          >
            Where Sharp Bettors
            <span className="block" style={{ color: '#fbbf24' }}>Get Their Edge</span>
          </h1>

          <p
            className="font-bold uppercase mx-auto"
            style={{
              fontFamily: TEAM_FONT,
              fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
              letterSpacing: '0.06em',
              color: '#fff',
              maxWidth: 640,
              marginBottom: '3.5rem',
            }}
          >
            Top Pick · Every Morning · Graded In Public
          </p>

          <p className="mb-8 mx-auto" style={{ fontSize: 18, color: '#fff', maxWidth: 560, lineHeight: 1.5 }}>
            <strong style={{ color: '#fff' }}>Free account</strong> gets the morning newsletter, odds tools, and our public tracker.
            {' '}<strong style={{ color: '#fde68a' }}>Premium ({PREMIUM_PRICE_DISPLAY})</strong> unlocks the full pick card and AI analysis.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => ctaSignup('hero_free_newsletter')}
              className="w-full sm:flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: '#f59e0b', color: '#0f172a', fontSize: 17 }}
            >
              Free Newsletter + 1 Daily Pick
            </button>
            <button
              type="button"
              onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: 'hero_primary' }); navigate('/premium') }}
              className="w-full sm:flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: '#fff', color: '#0f172a', fontSize: 17 }}
            >
              Premium — {PREMIUM_PRICE_DISPLAY}
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollToId('what-you-get')}
            className="mt-4 text-sm font-semibold underline"
            style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Compare free vs Premium ↓
          </button>
        </div>
      </header>

      <div className={`w-full ${CONTENT_PAD}`}>
        <div className={CONTENT_MAX}>
          <section id="what-you-get" className="pt-10 pb-6">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#f0fdf4', border: '2px solid #16a34a' }}
            >
              <div
                className="px-5 py-3.5"
                style={{ background: '#dcfce7', borderBottom: '2px solid #86efac' }}
              >
                <h2
                  className="font-black text-lg uppercase tracking-wide"
                  style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}
                >
                  Free account · $0
                </h2>
              </div>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {FREE_TIER_ROWS.map(({ label, value }, i) => (
                    <tr
                      key={label}
                      style={{
                        background: i % 2 === 0 ? '#f0fdf4' : '#ecfdf5',
                        borderBottom: i < FREE_TIER_ROWS.length - 1 ? '1px solid #bbf7d0' : 'none',
                      }}
                    >
                      <td
                        className="py-3.5 pl-5 pr-3 font-semibold"
                        style={{ fontSize: 16, color: '#0f172a', width: '44%', verticalAlign: 'middle' }}
                      >
                        {label}
                      </td>
                      <td
                        className="py-3.5 pr-5 text-right font-bold"
                        style={{ fontSize: 16, color: '#15803d', verticalAlign: 'middle' }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4" style={{ background: '#dcfce7', borderTop: '2px solid #86efac' }}>
                <button
                  type="button"
                  onClick={() => ctaSignup('free_tier')}
                  className="w-full px-8 py-3.5 rounded-xl font-bold"
                  style={{ background: '#0f172a', color: '#fff', fontSize: 17 }}
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </section>

          <section className="pb-10">
            <div
              className="rounded-2xl p-5 relative w-full"
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
                Vega&apos;s Top Picks
              </span>
              <h2 className="font-black text-2xl mb-1 uppercase" style={{ fontFamily: TEAM_FONT, color: '#fbbf24' }}>
                Premium
              </h2>
              <p className="font-bold text-xl mb-4" style={{ fontFamily: TEAM_FONT, color: '#fde68a' }}>
                $19.95 / month
              </p>
              {PREMIUM_FEATURES.map(f => (
                <div
                  key={f.title}
                  className="rounded-xl p-4 mb-3 last:mb-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                >
                  <strong className="block font-bold mb-1" style={{ fontSize: 17, color: '#fff' }}>{f.title}</strong>
                  <span style={{ fontSize: 16, color: '#fff', lineHeight: 1.45 }}>{f.detail}</span>
                </div>
              ))}
              <Link
                to="/premium"
                onClick={() => trackEvent('welcome_cta', { action: 'premium' })}
                className="block w-full mt-4 py-3.5 rounded-lg text-center font-extrabold"
                style={{ background: '#f59e0b', color: '#0f172a', fontSize: 17 }}
              >
                Upgrade to Premium
              </Link>
            </div>
          </section>

          <section className="py-8">
            <p className="mb-3" style={SECTION_LABEL}>How it works</p>
            <h2 className="font-black text-2xl sm:text-3xl mb-6 uppercase" style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}>
              What Powers Our Picks
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {POWERS.map(p => (
                <div key={p.title}>
                  <h3 className="font-bold mb-1" style={{ ...BODY, fontSize: 17 }}>
                    {p.title}
                    <span
                      className="ml-2 text-xs font-bold uppercase"
                      style={{ color: p.tag === 'LIVE' ? '#16a34a' : '#0f172a' }}
                    >
                      {p.tag}
                    </span>
                  </h3>
                  <p style={BODY_MUTED}>{p.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="public-record" className="pb-8" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '3.5rem' }}>
            <div className="rounded-2xl overflow-hidden w-full mb-6" style={{ border: '2px solid #f59e0b' }}>
              <div
                className="px-4 py-3 text-center"
                style={{ background: '#f59e0b', borderBottom: '2px solid #d97706' }}
              >
                <h2
                  className="font-black text-xl sm:text-2xl uppercase tracking-wide"
                  style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}
                >
                  Graded In Public
                </h2>
              </div>
            </div>
            <p className="mb-6" style={BODY_MUTED}>
              We grade every newsletter pick after games finish — wins, losses, and units tracked openly.
            </p>
            <div
              className="grid grid-cols-3 gap-4 rounded-2xl p-5 w-full"
              style={{ background: '#f8fafc', border: '2px solid #0f172a' }}
            >
              {[
                { label: 'Record', val: recordLabel, color: '#16a34a' },
                { label: 'Units', val: unitsLabel, color: '#16a34a' },
                { label: 'Graded', val: gradedLabel, color: '#b45309' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <span className="block font-bold uppercase mb-1" style={{ fontSize: 14, color: '#0f172a', letterSpacing: '0.1em' }}>
                    {label}
                  </span>
                  <span className="font-black text-2xl" style={{ fontFamily: TEAM_FONT, color }}>
                    {perf.loading ? '…' : val}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="todays-pick" className="py-10" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="mb-3" style={SECTION_LABEL}>Today&apos;s card</p>
            <h2 className="font-black text-2xl mb-4 uppercase" style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}>
              Top Pick Preview
            </h2>

            {pickLoading && (
              <div className="rounded-2xl mb-3 animate-pulse w-full" style={{ background: '#0f172a', height: 180 }} />
            )}

            {!pickLoading && pick && (
              <div className="rounded-2xl overflow-hidden mb-3 w-full" style={{ border: '2px solid #f59e0b' }}>
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ background: '#f59e0b', borderBottom: '2px solid #d97706' }}
                >
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#0f172a' }}>
                    Today&apos;s Top Pick Preview
                  </span>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase"
                    style={{ background: 'rgba(15, 23, 42, 0.12)', color: '#0f172a', fontFamily: TEAM_FONT }}
                  >
                    {pick.sport}
                  </span>
                </div>
                <div className="p-6 text-white" style={{ background: '#0f172a' }}>
                  <p className="mb-2 uppercase tracking-wide" style={{ fontFamily: TEAM_FONT, fontSize: 17, fontWeight: 600, color: '#fff' }}>
                    {pick.game}
                  </p>
                  <p className="font-bold mb-2 uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 22, letterSpacing: '0.02em' }}>
                    {pick.pick}
                  </p>
                  <p className="mb-3" style={{ fontSize: 17, color: '#fff', lineHeight: 1.45 }}>
                    {briefEdgeSummary(pick.edge)}
                  </p>
                  <p className="font-semibold" style={{ fontSize: 17, color: '#fbbf24', fontFamily: TEAM_FONT }}>{pick.bet}</p>
                </div>
              </div>
            )}

            {!pickLoading && !pick && (
              <div className="rounded-xl p-6 mb-3 text-center w-full" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="font-semibold mb-1" style={BODY}>Picks publish every morning</p>
                <Link to="/login" className="font-bold" style={{ fontSize: 17, color: '#2563eb' }}>Sign up for the free newsletter →</Link>
              </div>
            )}

          </section>

          <p className="text-center leading-relaxed pb-12" style={{ fontSize: 17, color: '#0f172a' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>Sign in</Link>
            {' · '}
            <Link to="/premium" className="font-semibold" style={{ color: '#2563eb' }}>Premium</Link>
            {' · '}
            <Link to="/disclaimer" className="font-semibold" style={{ color: '#2563eb' }}>Disclaimer</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
