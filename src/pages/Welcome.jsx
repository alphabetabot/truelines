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
const CARD_MAX = 520

const BODY = { fontSize: 16, color: NAVY, lineHeight: 1.6 }
const SECTION_LABEL = { fontSize: 12, fontWeight: 800, color: NAVY, letterSpacing: '0.16em', textTransform: 'uppercase' }
const CONTENT_PAD = 'px-6 sm:px-10'
const CONTENT_MAX = 'max-w-2xl mx-auto w-full'
const SECTION = 'py-16 sm:py-20'
const SECTION_RULE = { borderTop: '1px solid #e2e8f0' }

const FREE_INCLUDES = [
  'Morning newsletter — no credit card',
  'Homepage top-pick preview daily',
  'Live odds, line compare, public tracker',
]

const PREMIUM_FEATURES = [
  {
    title: 'Full AI Picks tab',
    detail: 'All 3 daily picks with write-ups, confidence, and on-demand generation.',
  },
  {
    title: 'Unlimited AI analysis',
    detail: 'Deep research on any game on the board.',
  },
  {
    title: 'Closing line value (CLV)',
    detail: 'See whether you beat the closing number.',
  },
]

const POWERS = [
  { title: 'Real-time odds', tag: 'LIVE', text: 'Six major sportsbooks, updated continuously.' },
  { title: 'Best-line value', tag: 'LIVE', text: 'The number worth betting, not noise.' },
  { title: 'Vega AI analysis', tag: 'LIVE', text: 'Picks from real data — never invented stats.' },
  { title: 'Public track record', tag: 'LIVE', text: 'Every pick graded to the game date.' },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SectionHeader({ label, title, intro }) {
  return (
    <div className="text-center mb-10 sm:mb-12">
      <p className="mb-3" style={SECTION_LABEL}>{label}</p>
      <h2 className="font-black text-2xl sm:text-3xl uppercase" style={{ fontFamily: TEAM_FONT, color: NAVY }}>
        {title}
      </h2>
      {intro && (
        <p className="mt-4 mx-auto" style={{ ...BODY, maxWidth: 480 }}>
          {intro}
        </p>
      )}
    </div>
  )
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
          padding: '48px 0 56px',
          borderBottom: `3px solid ${AMBER}`,
        }}
      >
        <div className={`${CONTENT_MAX} ${CONTENT_PAD}`}>
          <div className="flex justify-center mb-8">
            <LogoLink height={88} maxWidth={440} />
          </div>

          <p className="text-xs font-bold uppercase mb-5" style={{ color: AMBER, letterSpacing: '0.2em' }}>
            Vega&apos;s Daily AI Picks
          </p>

          <h1
            className="font-black leading-tight mb-6 mx-auto"
            style={{
              fontSize: 'clamp(1.85rem, 6vw, 3rem)',
              letterSpacing: '-0.01em',
              color: NAVY,
              lineHeight: 1.12,
              maxWidth: 640,
            }}
          >
            Where Sharp Bettors
            <span className="block mt-1" style={{ color: AMBER }}>Get Their Edge</span>
          </h1>

          <p
            className="font-bold mb-8 uppercase mx-auto"
            style={{
              fontFamily: TEAM_FONT,
              fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
              letterSpacing: '0.06em',
              color: NAVY,
              maxWidth: 520,
            }}
          >
            Three Picks · Every Morning · Graded In Public
          </p>

          <p className="mb-10 mx-auto" style={{ ...BODY, maxWidth: 480 }}>
            Free account gets the newsletter and tools.
            {' '}Premium ({PREMIUM_PRICE_DISPLAY}) unlocks the full card and AI analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button
              type="button"
              onClick={() => ctaSignup('hero_free_newsletter')}
              className="w-full px-8 py-3.5 rounded-xl font-bold"
              style={{ background: AMBER, color: NAVY, fontSize: 16 }}
            >
              Get Free Newsletter
            </button>
            <button
              type="button"
              onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: 'hero_primary' }); navigate('/premium') }}
              className="w-full px-8 py-3.5 rounded-xl font-bold"
              style={{ background: NAVY, color: '#fff', fontSize: 16 }}
            >
              Premium — {PREMIUM_PRICE_DISPLAY}
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollToId('what-you-get')}
            className="mt-8 text-sm font-semibold underline"
            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Compare free vs Premium ↓
          </button>
        </div>
      </header>

      <div className={`w-full ${CONTENT_PAD}`}>
        <div className={CONTENT_MAX}>
          <section id="todays-pick" className={SECTION}>
            <SectionHeader label="Today's card" title="Top Pick Preview" />
            <div className="mx-auto" style={{ maxWidth: CARD_MAX }}>
              <DailyPick showEmpty />
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { trackEvent('welcome_cta', { action: 'premium', source: `locked_pick_${n}` }); navigate('/premium') }}
                    className="rounded-xl py-6 px-4 text-center w-full"
                    style={{
                      background: '#fff',
                      border: `2px solid ${AMBER}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(245, 158, 11, 0.12)' }}
                    >
                      <Lock size={14} style={{ color: AMBER }} />
                    </div>
                    <p className="font-bold uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 15, color: NAVY }}>
                      Pick #{n}
                    </p>
                    <span className="block font-semibold mt-1.5" style={{ fontSize: 13, color: '#b45309' }}>Premium</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="what-you-get" className={SECTION} style={SECTION_RULE}>
            <SectionHeader label="Compare" title="Free vs Premium" />

            <div className="flex flex-col gap-10 sm:gap-12 mx-auto" style={{ maxWidth: CARD_MAX }}>
              <div
                className="rounded-2xl p-6 sm:p-7"
                style={{ background: '#fff', border: `2px solid ${NAVY}` }}
              >
                <h3 className="font-black text-lg mb-1 uppercase text-center" style={{ fontFamily: TEAM_FONT, color: NAVY }}>
                  Free Account
                </h3>
                <p className="text-center font-bold mb-6" style={{ color: '#2563eb', fontSize: 15 }}>$0</p>
                <ul className="space-y-4 mb-8">
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
                  style={{ background: NAVY, color: '#fff', fontSize: 16 }}
                >
                  Create Free Account
                </button>
              </div>

              <div
                className="rounded-2xl p-6 sm:p-7 relative"
                style={{
                  background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 100%)',
                  border: `2px solid ${AMBER}`,
                  color: '#fff',
                }}
              >
                <span
                  className="absolute -top-2.5 right-5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md"
                  style={{ background: AMBER, color: NAVY, letterSpacing: '0.1em' }}
                >
                  Vega&apos;s Top Picks
                </span>
                <h3 className="font-black text-xl mb-1 uppercase" style={{ fontFamily: TEAM_FONT, color: '#fbbf24' }}>
                  Premium
                </h3>
                <p className="font-bold text-lg mb-6" style={{ fontFamily: TEAM_FONT, color: '#fde68a' }}>
                  {PREMIUM_PRICE_DISPLAY}
                </p>
                <ul className="space-y-5 mb-8">
                  {PREMIUM_FEATURES.map(f => (
                    <li key={f.title}>
                      <strong className="block font-bold mb-1" style={{ fontSize: 15, color: '#fff' }}>{f.title}</strong>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{f.detail}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/premium"
                  onClick={() => trackEvent('welcome_cta', { action: 'premium' })}
                  className="block w-full py-3.5 rounded-lg text-center font-extrabold"
                  style={{ background: AMBER, color: NAVY, fontSize: 16 }}
                >
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          </section>

          <section id="public-record" className={SECTION} style={SECTION_RULE}>
            <SectionHeader
              label="Public record"
              title="Graded In Public"
              intro="Every newsletter pick graded after games finish — wins, losses, and units tracked openly."
            />
            <div
              className="grid grid-cols-3 gap-6 rounded-2xl p-6 sm:p-8 mx-auto"
              style={{ background: '#fff', border: `2px solid ${NAVY}`, maxWidth: CARD_MAX }}
            >
              {[
                { label: 'Record', val: recordLabel, color: '#16a34a' },
                { label: 'Units', val: unitsLabel, color: '#16a34a' },
                { label: 'Graded', val: gradedLabel, color: '#b45309' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <span className="block font-bold uppercase mb-2" style={{ fontSize: 12, color: NAVY, letterSpacing: '0.12em' }}>
                    {label}
                  </span>
                  <span className="font-black text-2xl sm:text-3xl" style={{ fontFamily: TEAM_FONT, color }}>
                    {perf.loading ? '…' : val}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${SECTION} pb-20`} style={SECTION_RULE}>
            <SectionHeader label="How it works" title="What Powers Our Picks" />
            <ul className="space-y-8 mx-auto" style={{ maxWidth: CARD_MAX }}>
              {POWERS.map(p => (
                <li key={p.title}>
                  <h3 className="font-bold mb-2" style={{ ...BODY, fontSize: 15 }}>
                    {p.title}
                    <span
                      className="ml-2 text-[11px] font-bold uppercase"
                      style={{ color: p.tag === 'LIVE' ? '#16a34a' : NAVY }}
                    >
                      {p.tag}
                    </span>
                  </h3>
                  <p style={BODY}>{p.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-center leading-relaxed pb-16" style={{ fontSize: 15, color: NAVY }}>
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
