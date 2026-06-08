import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { briefEdgeSummary } from '../lib/pickText'
import { trackEvent } from '../lib/analytics'
import LogoLink from '../components/LogoLink'

const sportColor = { MLB: '#22c55e', NBA: '#2563eb', NHL: '#6366f1' }

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"
const BODY = { fontSize: 18, color: '#0f172a', lineHeight: 1.55 }
const BODY_MUTED = { fontSize: 16, color: '#334155', lineHeight: 1.5 }
const SECTION_LABEL = { fontSize: 14, fontWeight: 700, color: '#334155', letterSpacing: '0.14em', textTransform: 'uppercase' }

const OFFER_BULLETS = [
  'All 3 daily picks with full write-ups and confidence scores',
  'Unlimited AI analysis on any game — injuries, weather, stats',
  'Public track record — every pick graded to the game date',
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

  const recordLabel = perf.hasRecord && !perf.error
    ? `${perf.wins}–${perf.losses}`
    : '—'
  const unitsLabel = perf.hasRecord && !perf.error
    ? `${perf.totalUnits > 0 ? '+' : ''}${perf.totalUnits.toFixed(2)}u`
    : '—'
  const gradedLabel = perf.hasRecord && !perf.error ? `${perf.gradedCount} picks` : '—'

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <header
        className="relative overflow-hidden text-center"
        style={{
          background: 'linear-gradient(165deg, #0a0f1a 0%, #0f172a 45%, #1a2332 100%)',
          color: '#fff',
          margin: '0 -1rem',
          padding: '32px 1.5rem 56px',
        }}
      >
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <LogoLink height={96} maxWidth={440} />
          </div>

          <p
            className="font-semibold mb-5"
            style={{ fontSize: 19, color: '#fbbf24', letterSpacing: '0.04em' }}
          >
            Where sharp bettors get their edge
          </p>

          <h1
            className="font-black leading-tight mb-4 uppercase"
            style={{
              fontFamily: TEAM_FONT,
              fontSize: 'clamp(1.85rem, 5.5vw, 3rem)',
              letterSpacing: '0.02em',
            }}
          >
            Three picks.
            <span className="block" style={{ color: '#fbbf24' }}>Every morning.</span>
            <span className="block text-white" style={{ fontSize: '0.88em', marginTop: 6 }}>Graded in public.</span>
          </h1>

          <p className="mb-8 mx-auto" style={{ ...BODY_MUTED, color: 'rgba(255,255,255,0.82)', maxWidth: 480 }}>
            Vega&apos;s AI research on MLB, NBA, and NHL — <strong style={{ color: '#fff' }}>$19.95/mo</strong>, cancel anytime.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: 'hero_primary' }); navigate('/premium') }}
              className="px-8 py-4 rounded-xl font-bold"
              style={{ background: '#f59e0b', color: '#0f172a', fontSize: 17 }}
            >
              Subscribe — $19.95/mo
            </button>
            <button
              type="button"
              onClick={() => scrollToId('what-you-get')}
              className="px-6 py-4 rounded-xl font-semibold"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)', fontSize: 16 }}
            >
              See what&apos;s included ↓
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <section id="what-you-get" className="py-10">
          <p className="mb-3" style={SECTION_LABEL}>What you get</p>
          <ul className="space-y-3 mb-2">
            {OFFER_BULLETS.map(item => (
              <li key={item} className="flex gap-3" style={BODY}>
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-4 pb-10">
          <p className="mb-3" style={SECTION_LABEL}>Premium</p>
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
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{f.detail}</span>
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
            What powers our picks
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {POWERS.map(p => (
              <div key={p.title}>
                <h3 className="font-bold mb-1" style={{ ...BODY, fontSize: 17 }}>
                  {p.title}
                  <span
                    className="ml-2 text-xs font-bold uppercase"
                    style={{ color: p.tag === 'LIVE' ? '#16a34a' : '#64748b' }}
                  >
                    {p.tag}
                  </span>
                </h3>
                <p style={BODY_MUTED}>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="public-record" className="py-8" style={{ borderTop: '1px solid #e2e8f0' }}>
          <p className="mb-3" style={SECTION_LABEL}>Public record</p>
          <h2 className="font-black text-2xl mb-2 uppercase" style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}>
            Graded in public
          </h2>
          <p className="mb-6" style={BODY_MUTED}>
            We grade every newsletter pick after games finish — wins, losses, and units tracked openly.
          </p>
          <div
            className="grid grid-cols-3 gap-4 rounded-2xl p-5"
            style={{ background: '#f8fafc', border: '2px solid #0f172a' }}
          >
            {[
              { label: 'Record', val: recordLabel, color: '#16a34a' },
              { label: 'Units', val: unitsLabel, color: '#16a34a' },
              { label: 'Graded', val: gradedLabel, color: '#b45309' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <span className="block font-bold uppercase mb-1" style={{ fontSize: 13, color: '#334155', letterSpacing: '0.1em' }}>
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
            Top pick preview
          </h2>

          {pickLoading && (
            <div className="rounded-2xl mb-3 animate-pulse" style={{ background: '#0f172a', height: 180 }} />
          )}

          {!pickLoading && pick && (
            <div className="rounded-2xl p-6 mb-3 text-white" style={{ background: '#0f172a' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-md uppercase" style={{ background: (sportColor[pick.sport] || '#64748b') + '33', color: sportColor[pick.sport] || '#64748b', fontFamily: TEAM_FONT }}>
                  {pick.sport}
                </span>
                <span className="text-sm font-bold uppercase" style={{ color: '#f59e0b', fontFamily: TEAM_FONT }}>Top pick</span>
              </div>
              <p className="mb-2 uppercase tracking-wide" style={{ fontFamily: TEAM_FONT, fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
                {pick.game}
              </p>
              <p className="font-bold mb-2 uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 22, letterSpacing: '0.02em' }}>
                {pick.pick}
              </p>
              <p className="mb-3" style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
                {briefEdgeSummary(pick.edge)}
              </p>
              <p className="font-semibold" style={{ fontSize: 17, color: '#fbbf24', fontFamily: TEAM_FONT }}>{pick.bet}</p>
            </div>
          )}

          {!pickLoading && !pick && (
            <div className="rounded-xl p-6 mb-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="font-semibold mb-1" style={BODY}>Picks publish every morning</p>
              <Link to="/premium" className="font-bold" style={{ fontSize: 17, color: '#2563eb' }}>Subscribe for the full card →</Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            {[2, 3].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: `locked_pick_${n}` }); navigate('/premium') }}
                className="rounded-2xl p-5 text-center w-full"
                style={{ background: '#fff', border: '2px dashed #cbd5e1', cursor: 'pointer' }}
              >
                <div className="text-2xl mb-2 opacity-50">🔒</div>
                <p className="font-bold uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 16, color: '#0f172a' }}>
                  Pick #{n}
                </p>
                <span className="block font-semibold mt-1" style={{ fontSize: 15, color: '#334155' }}>Premium</span>
              </button>
            ))}
          </div>
          <p className="text-center" style={BODY_MUTED}>
            <Link to="/premium" className="font-bold" style={{ color: '#0f172a', fontSize: 17 }}>
              Premium
            </Link>
            {' '}unlocks all three daily picks with full write-ups.
          </p>
        </section>

        <p className="text-center leading-relaxed pb-10" style={{ fontSize: 16, color: '#334155' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#2563eb' }}>Sign in</Link>
          {' · '}
          <Link to="/premium" className="font-semibold" style={{ color: '#2563eb' }}>Premium</Link>
          {' · '}
          <Link to="/disclaimer" className="font-semibold" style={{ color: '#2563eb' }}>Disclaimer</Link>
        </p>
      </div>
    </div>
  )
}
