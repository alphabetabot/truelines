import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { trackEvent } from '../lib/analytics'
import LogoLink from '../components/LogoLink'
import DailyPick from '../components/DailyPick'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"
const PAGE_BG = 'var(--bg-primary)'
const NAVY = '#0f172a'
const AMBER = '#f59e0b'
const BODY = { fontSize: 18, color: NAVY, lineHeight: 1.55 }
const BODY_MUTED = { fontSize: 17, color: NAVY, lineHeight: 1.5 }
const SECTION_LABEL = { fontSize: 14, fontWeight: 800, color: NAVY, letterSpacing: '0.14em', textTransform: 'uppercase' }
const CONTENT_PAD = 'px-5 sm:px-8 lg:px-12'
const CONTENT_MAX = 'max-w-3xl mx-auto w-full'

const FREE_INCLUDES = [
  'Morning newsletter email — no credit card',
  'Homepage top-pick preview every day',
  'Live odds, line compare, and public tracker',
]

const PREMIUM_BULLETS = [
  'Full AI Picks tab — all 3 daily picks with write-ups',
  'Unlimited AI analysis on any game',
  'Injury, weather, and advanced stats depth',
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

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Welcome() {
  const navigate = useNavigate()
  const perf = usePickPerformance()

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
          background: PAGE_BG,
          color: NAVY,
          padding: '36px 0 44px',
          borderBottom: '3px solid #f59e0b',
        }}
      >
        <div className={`${CONTENT_MAX} ${CONTENT_PAD} relative z-10`}>
          <div className="flex justify-center mb-6">
            <LogoLink height={96} maxWidth={480} />
          </div>

          <p className="text-xs font-bold uppercase mb-4 mx-auto" style={{ color: AMBER, letterSpacing: '0.2em' }}>
            Vega&apos;s Daily AI Picks
          </p>

          <h1
            className="font-black leading-tight mb-4 mx-auto"
            style={{
              fontSize: 'clamp(2rem, 7vw, 3.5rem)',
              letterSpacing: '-0.01em',
              color: NAVY,
              lineHeight: 1.1,
              maxWidth: 720,
            }}
          >
            Where Sharp Bettors
            <span className="block" style={{ color: AMBER }}>Get Their Edge</span>
          </h1>

          <p
            className="font-bold mb-4 uppercase mx-auto"
            style={{
              fontFamily: TEAM_FONT,
              fontSize: 'clamp(1rem, 3vw, 1.35rem)',
              letterSpacing: '0.06em',
              color: NAVY,
              maxWidth: 640,
            }}
          >
            Three Picks · Every Morning · Graded In Public
          </p>

          <p className="mb-8 mx-auto" style={{ fontSize: 18, color: NAVY, maxWidth: 560, lineHeight: 1.5 }}>
            <strong>Free account</strong> gets the morning newsletter, odds tools, and our public tracker.
            {' '}<strong style={{ color: '#b45309' }}>Premium ({PREMIUM_PRICE_DISPLAY})</strong> unlocks the full pick card and AI analysis.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => ctaSignup('hero_free_newsletter')}
              className="w-full sm:flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: AMBER, color: NAVY, fontSize: 17 }}
            >
              Get Free Newsletter
            </button>
            <button
              type="button"
              onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: 'hero_primary' }); navigate('/premium') }}
              className="w-full sm:flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: NAVY, color: '#fff', fontSize: 17 }}
            >
              Premium — {PREMIUM_PRICE_DISPLAY}
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollToId('what-you-get')}
            className="mt-4 text-sm font-semibold underline"
            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Compare free vs Premium ↓
          </button>
        </div>
      </header>

      <div className={`w-full ${CONTENT_PAD}`}>
        <div className={CONTENT_MAX}>
          <section id="what-you-get" className="py-10 text-center">
            <p className="mb-3" style={SECTION_LABEL}>Free account — $0</p>
            <div
              className="rounded-2xl p-5 mb-8 mx-auto text-left"
              style={{ background: '#fff', border: `2px solid ${NAVY}`, maxWidth: 560 }}
            >
              <h2 className="font-black text-xl mb-3 uppercase text-center" style={{ fontFamily: TEAM_FONT, color: NAVY }}>
                Newsletter &amp; Tools Stay Free
              </h2>
              <ul className="space-y-3 mb-4">
                {FREE_INCLUDES.map(item => (
                  <li key={item} className="flex gap-3" style={BODY}>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => ctaSignup('free_tier')}
                className="w-full px-8 py-3.5 rounded-xl font-bold"
                style={{ background: NAVY, color: '#fff', fontSize: 17 }}
              >
                Create Free Account
              </button>
            </div>

            <p className="mb-3" style={SECTION_LABEL}>Premium — {PREMIUM_PRICE_DISPLAY}</p>
            <ul className="space-y-3 mb-2 mx-auto text-left" style={{ maxWidth: 560 }}>
              {PREMIUM_BULLETS.map(item => (
                <li key={item} className="flex gap-3" style={BODY}>
                  <span style={{ color: AMBER, fontWeight: 800 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="py-4 pb-10 text-center">
            <div
              className="rounded-2xl p-5 relative w-full mx-auto text-left"
              style={{ maxWidth: 560 }}
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

          <section id="public-record" className="py-8" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="mb-3" style={SECTION_LABEL}>Public record</p>
            <h2 className="font-black text-2xl mb-2 uppercase" style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}>
              Graded In Public
            </h2>
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

          <section id="todays-pick" className="py-10 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="mb-3" style={SECTION_LABEL}>Today&apos;s card</p>
            <h2 className="font-black text-2xl mb-6 uppercase" style={{ fontFamily: TEAM_FONT, color: NAVY }}>
              Top Pick Preview
            </h2>

            <div className="mx-auto text-left" style={{ maxWidth: 560 }}>
              <DailyPick showEmpty />

              <div className="grid grid-cols-2 gap-3 mb-3 w-full">
                {[2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: `locked_pick_${n}` }); navigate('/premium') }}
                    className="rounded-2xl p-5 text-center w-full"
                    style={{
                      background: '#fff',
                      border: `2px solid ${AMBER}`,
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
                      style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                    >
                      <Lock size={16} style={{ color: AMBER }} />
                    </div>
                    <p className="font-bold uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 16, color: NAVY }}>
                      Pick #{n}
                    </p>
                    <span className="block font-semibold mt-1" style={{ fontSize: 14, color: '#b45309' }}>Premium</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-center" style={BODY_MUTED}>
              <Link to="/login" className="font-bold" style={{ color: '#0f172a', fontSize: 17 }}>
                Free newsletter
              </Link>
              {' '}for email + tracker ·{' '}
              <Link to="/premium" className="font-bold" style={{ color: '#0f172a', fontSize: 17 }}>
                Premium
              </Link>
              {' '}for the full daily card.
            </p>
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
