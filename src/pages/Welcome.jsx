import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, TrendingUp, BarChart2, Check, Lock, ClipboardCheck, Eye, Shield } from 'lucide-react'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { trackEvent } from '../lib/analytics'
import { briefEdgeSummary } from '../lib/pickText'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'
import HomeNav from '../components/marketing/HomeNav'
import HomeFooter from '../components/marketing/HomeFooter'

const PAGE = 'max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8'
const VEGA_IMAGE = '/realvega.jpeg'

const BG = '#030712'
const TEXT = '#fafafa'
const MUTED = '#a1a1aa'
const DIM = '#71717a'
const ACCENT = '#4ade80'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'

function isPlaceholderBet(bet) {
  return !bet || bet.includes('-10000') || bet.includes('-99999')
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function confidencePercent(confidence) {
  if (!confidence) return null
  const stars = (String(confidence).match(/★/g) || []).length
  if (stars > 0) return Math.round((stars / 5) * 100)
  const num = parseInt(String(confidence).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(num) && num <= 100 ? num : null
}

function edgePercentFromText(edge) {
  if (!edge) return null
  const match = String(edge).match(/(\d+(?:\.\d+)?)\s*%/)
  return match ? `${match[1]}%` : null
}

function CheckItem({ children, accent = ACCENT }) {
  return (
    <li className="flex items-start gap-2.5 text-sm" style={{ color: MUTED }}>
      <Check size={16} className="shrink-0 mt-0.5" style={{ color: accent }} />
      <span>{children}</span>
    </li>
  )
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
        // optional
      } finally {
        if (!cancelled) setPickLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function ctaSignup(source) {
    trackEvent('welcome_cta', { action: 'signup', source })
    navigate('/login', { state: { mode: 'signup' } })
  }

  function ctaPremium(source) {
    trackEvent('welcome_cta', { action: 'premium', source })
    navigate('/premium')
  }

  const picksTracked = perf.hasRecord && !perf.error ? String(perf.gradedCount) : '—'
  const recordLabel = perf.hasRecord && !perf.error ? `${perf.wins}–${perf.losses}` : '—'

  const edgePct = pick ? edgePercentFromText(pick.edge) : null
  const confPct = pick ? confidencePercent(pick.confidence) : null
  const edgePreview = pick?.edge ? briefEdgeSummary(pick.edge, 2) : null

  return (
    <div
      className="w-full text-white min-h-screen pb-28"
      style={{
        fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: `radial-gradient(ellipse 120% 80% at 50% -20%, rgba(59, 130, 246, 0.1), transparent 55%), ${BG}`,
      }}
    >
      <HomeNav />

      {/* ── HERO ── */}
      <header className={`${PAGE} pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-20 lg:pb-24`}>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1
              className="font-black leading-[1.06] tracking-tight mb-4 sm:mb-5"
              style={{ fontSize: 'clamp(2rem, 8vw, 3.75rem)' }}
            >
              <span style={{ color: TEXT }}>Smarter Bets.</span>
              <br />
              <span style={{ color: '#e4e4e7' }}>Real Edge.</span>
              <br />
              <span style={{ color: '#a1a1aa' }}>Real Profits.</span>
            </h1>

            <p className="text-sm sm:text-lg leading-relaxed mb-5 sm:mb-6 max-w-lg mx-auto lg:mx-0" style={{ color: MUTED }}>
              Daily sports betting picks powered by AI analysis, sharp money tracking,
              injury intelligence, and real sportsbook data.
            </p>

            {/* Mobile: compact Vega visible above the fold */}
            <div className="flex justify-center mb-5 sm:mb-6 lg:hidden">
              <img
                src={VEGA_IMAGE}
                alt="Vega — TrueOddsIQ AI sports analyst"
                className="rounded-xl"
                style={{
                  maxHeight: 200,
                  width: 'auto',
                  maxWidth: '85%',
                  objectFit: 'contain',
                  objectPosition: 'center top',
                  filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8 lg:mb-10">
              <button
                type="button"
                onClick={() => ctaSignup('hero_free_pick')}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-opacity hover:opacity-90"
                style={{ background: '#fafafa', color: '#09090b' }}
              >
                Get Today&apos;s Free Pick
              </button>
              <button
                type="button"
                onClick={() => scrollToId('how-it-works')}
                className="px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-colors hover:bg-white/5"
                style={{ color: TEXT, border: '1px solid rgba(255,255,255,0.15)' }}
              >
                See How It Works
              </button>
            </div>

            <div className="hidden lg:flex flex-row flex-wrap gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <Brain size={18} style={{ color: '#94a3b8' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d8' }}>AI-Powered Analysis</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <TrendingUp size={18} style={{ color: '#94a3b8' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d8' }}>Sharp Money Tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <BarChart2 size={18} style={{ color: '#94a3b8' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d8' }}>Live Odds From 6 Books</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="relative w-full" style={{ maxWidth: 480 }}>
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(96, 165, 250, 0.25), transparent 70%)' }}
                aria-hidden
              />
              <img
                src={VEGA_IMAGE}
                alt="Vega — TrueOddsIQ AI sports analyst"
                className="relative w-full h-auto rounded-2xl"
                style={{
                  maxHeight: 'min(70vh, 560px)',
                  objectFit: 'contain',
                  objectPosition: 'center top',
                  filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.45))',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── TODAY'S TOP PICK ── */}
      <section id="top-pick" className={`${PAGE} py-14 sm:py-20`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: DIM }}>
          Today&apos;s top pick
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 tracking-tight" style={{ color: TEXT }}>
          Vega&apos;s pick of the day
        </h2>

        {pickLoading ? (
          <div className="rounded-2xl animate-pulse h-72 max-w-2xl mx-auto" style={{ background: CARD }} />
        ) : pick ? (
          <div
            className="max-w-2xl mx-auto rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: `0 0 0 1px ${BORDER}, 0 24px 48px rgba(0,0,0,0.35)`,
            }}
          >
            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: DIM }}>
                {pick.sport}
              </p>
              <p className="text-xl sm:text-2xl font-bold mb-1" style={{ color: TEXT }}>{pick.game}</p>
              <p className="text-lg font-semibold mb-6" style={{ color: '#e4e4e7' }}>{pick.pick}</p>

              <div className="flex flex-wrap gap-8 mb-6">
                {edgePct && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: DIM }}>Edge</p>
                    <p className="text-2xl font-bold" style={{ color: ACCENT }}>{edgePct}</p>
                  </div>
                )}
                {confPct != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: DIM }}>Confidence</p>
                    <p className="text-2xl font-bold" style={{ color: TEXT }}>{confPct}%</p>
                  </div>
                )}
              </div>

              {edgePreview && (
                <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>
                  {edgePreview}
                  <span style={{ color: DIM }}> …</span>
                </p>
              )}

              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  <Lock size={18} style={{ color: '#94a3b8' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>Full analysis locked</p>
                  <p className="text-xs" style={{ color: DIM }}>Sign up free for the complete write-up and daily email</p>
                </div>
                <button
                  type="button"
                  onClick={() => ctaSignup('pick_unlock')}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#fafafa', color: '#09090b' }}
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="max-w-2xl mx-auto rounded-2xl p-10 text-center"
            style={{ background: CARD, boxShadow: `0 0 0 1px ${BORDER}` }}
          >
            <p className="text-lg font-semibold mb-2" style={{ color: '#e4e4e7' }}>Picks publish every morning</p>
            <p className="text-sm mb-6" style={{ color: DIM }}>Pacific time · Sign up free to get today&apos;s pick by email</p>
            <button
              type="button"
              onClick={() => ctaSignup('pick_empty')}
              className="px-7 py-3.5 rounded-full font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Get Today&apos;s Free Pick
            </button>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={`${PAGE} py-14 sm:py-20`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight" style={{ color: TEXT }}>
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              step: '01',
              title: 'Vega analyzes the slate',
              body: 'AI scans odds from six books, injury reports, and sharp money movement every morning.',
            },
            {
              step: '02',
              title: 'You get the top pick free',
              body: 'Create a free account for today\'s best bet by email — edge, confidence, and key angles included.',
            },
            {
              step: '03',
              title: 'Every result is graded publicly',
              body: 'Wins and losses post to the tracker after games finish. No hidden record, no cherry-picking.',
            },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              className="rounded-2xl p-6"
              style={{ background: CARD, boxShadow: `0 0 0 1px ${BORDER}` }}
            >
              <p className="text-xs font-bold mb-4 tracking-widest" style={{ color: '#52525b' }}>{step}</p>
              <p className="text-lg font-semibold mb-2" style={{ color: TEXT }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VERIFIED RESULTS ── */}
      <section id="results" className={`${PAGE} py-14 sm:py-20`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight" style={{ color: TEXT }}>
          Verified. Transparent.
        </h2>
        <p className="text-center text-sm mb-12 max-w-lg mx-auto" style={{ color: MUTED }}>
          Every pick is graded in public after the final whistle. See the full history — wins and losses included.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mb-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <ClipboardCheck size={22} style={{ color: '#94a3b8' }} />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-1 tracking-tight" style={{ color: TEXT }}>{perf.loading ? '…' : picksTracked}</p>
            <p className="text-xs sm:text-sm uppercase tracking-wider" style={{ color: DIM }}>Picks graded publicly</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Eye size={22} style={{ color: '#94a3b8' }} />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-1 tracking-tight" style={{ color: TEXT }}>{perf.loading ? '…' : recordLabel}</p>
            <p className="text-xs sm:text-sm uppercase tracking-wider" style={{ color: DIM }}>Win–loss record posted</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <Shield size={22} style={{ color: '#94a3b8' }} />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-1 tracking-tight" style={{ color: TEXT }}>100%</p>
            <p className="text-xs sm:text-sm uppercase tracking-wider" style={{ color: DIM }}>Transparent grading</p>
          </div>
        </div>
        <div className="text-center">
          <Link
            to="/odds?tracker=1#pick-tracker"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
            style={{ color: MUTED }}
          >
            View full track record →
          </Link>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={`${PAGE} py-14 sm:py-20 pb-24`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight" style={{ color: TEXT }}>
          Simple pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-7 flex flex-col"
            style={{ background: CARD, boxShadow: `0 0 0 1px ${BORDER}` }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: DIM }}>Free</p>
            <p className="text-3xl font-bold mb-6" style={{ color: TEXT }}>
              $0 <span className="text-base font-normal" style={{ color: DIM }}>/mo</span>
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              <CheckItem>1 daily pick via email</CheckItem>
              <CheckItem>Live odds from 6 books</CheckItem>
              <CheckItem>Basic AI pick summary</CheckItem>
              <CheckItem>Public track record</CheckItem>
            </ul>
            <button
              type="button"
              onClick={() => ctaSignup('pricing_free')}
              className="w-full py-3 rounded-full font-semibold transition-colors hover:bg-white/10"
              style={{ color: TEXT, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.05)' }}
            >
              Start free
            </button>
          </div>

          <div
            className="rounded-2xl p-7 flex flex-col relative"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a1a1aa' }}>Premium</p>
            <p className="text-3xl font-bold mb-6" style={{ color: TEXT }}>
              {PREMIUM_PRICE_DISPLAY.replace('/mo', '')}
              <span className="text-base font-normal" style={{ color: DIM }}>/mo</span>
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                '3 premium picks daily',
                'Full AI analysis & write-ups',
                'Sharp money & injury reports',
                'Closing line value tracking',
              ].map(item => (
                <CheckItem key={item} accent="#f59e0b">{item}</CheckItem>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => ctaPremium('pricing_premium')}
              className="w-full py-3 rounded-full font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Go Premium
            </button>
          </div>

          <div
            className="rounded-2xl p-7 flex flex-col items-center text-center"
            style={{ background: CARD, boxShadow: `0 0 0 1px ${BORDER}` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mt-2"
              style={{ border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)' }}
            >
              <BarChart2 size={26} style={{ color: '#94a3b8' }} />
            </div>
            <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: MUTED }}>
              See exactly what&apos;s included in free vs Premium before you decide.
            </p>
            <Link
              to="/plans"
              onClick={() => trackEvent('welcome_cta', { action: 'plans', source: 'pricing_compare' })}
              className="w-full py-3 rounded-full font-semibold text-center block transition-colors hover:bg-white/5"
              style={{ color: TEXT, border: `1px solid ${BORDER}` }}
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
