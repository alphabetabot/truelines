import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { trackEvent } from '../lib/analytics'
import { briefEdgeSummary } from '../lib/pickText'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const PAGE = 'max-w-6xl mx-auto w-full px-6 sm:px-10 lg:px-12'
const VEGA_IMAGE = '/realvega.jpeg'

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
        // optional preview
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

  const winRate = perf.hasRecord && perf.winRate != null ? `${perf.winRate}%` : '—'
  const unitsLabel = perf.hasRecord && !perf.error
    ? `${perf.totalUnits > 0 ? '+' : ''}${perf.totalUnits.toFixed(2)}u`
    : '—'
  const picksTracked = perf.hasRecord && !perf.error ? String(perf.gradedCount) : '—'

  const edgePct = pick ? edgePercentFromText(pick.edge) : null
  const confPct = pick ? confidencePercent(pick.confidence) : null

  return (
    <div
      className="w-full text-white"
      style={{
        fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(59, 130, 246, 0.12), transparent 55%), #030712',
      }}
    >
      {/* ── HERO ── */}
      <header className={`${PAGE} pt-16 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32`}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1
              className="font-black leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)', color: '#fafafa' }}
            >
              Smarter Bets.
              <span className="block" style={{ color: '#e4e4e7' }}>Real Edge.</span>
              <span className="block" style={{ color: '#a1a1aa' }}>Real Profits.</span>
            </h1>

            <p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
              style={{ color: '#a1a1aa' }}
            >
              Daily sports betting picks powered by AI analysis, sharp money tracking,
              injury intelligence, and real sportsbook data.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => ctaSignup('hero_free_pick')}
                className="px-8 py-4 rounded-full font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#fafafa', color: '#09090b' }}
              >
                Get Today&apos;s Free Pick
              </button>
              <button
                type="button"
                onClick={() => scrollToId('top-pick')}
                className="px-8 py-4 rounded-full font-semibold text-base transition-colors hover:bg-white/10"
                style={{ color: '#fafafa', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                See How It Works
              </button>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-md lg:max-w-none"
              style={{ maxWidth: 'min(100%, 520px)' }}
            >
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
                style={{ background: 'radial-gradient(circle at 50% 40%, rgba(96, 165, 250, 0.35), transparent 70%)' }}
                aria-hidden
              />
              <img
                src={VEGA_IMAGE}
                alt="Vega — TrueOddsIQ AI sports analyst"
                className="relative w-full h-auto rounded-2xl object-contain"
                style={{
                  maxHeight: 'min(72vh, 640px)',
                  objectPosition: 'center top',
                  filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.45))',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── TODAY'S TOP PICK ── */}
      <section id="top-pick" className={`${PAGE} py-16 sm:py-20`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: '#71717a' }}>
          Today&apos;s top pick
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 tracking-tight" style={{ color: '#fafafa' }}>
          Vega&apos;s pick of the day
        </h2>

        {pickLoading ? (
          <div
            className="rounded-2xl animate-pulse mx-auto max-w-2xl"
            style={{ height: 280, background: 'rgba(255,255,255,0.04)' }}
          />
        ) : pick ? (
          <div
            className="mx-auto max-w-2xl rounded-2xl p-8 sm:p-10"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.35)',
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: '#a1a1aa' }}>{pick.sport}</p>
            <p className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#fafafa' }}>{pick.game}</p>
            <p className="text-lg font-semibold mb-6" style={{ color: '#e4e4e7' }}>{pick.pick}</p>

            <div className="flex flex-wrap gap-8 mb-6">
              {edgePct && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#71717a' }}>Edge</p>
                  <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>{edgePct}</p>
                </div>
              )}
              {confPct != null && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#71717a' }}>Confidence</p>
                  <p className="text-2xl font-bold" style={{ color: '#fafafa' }}>{confPct}%</p>
                </div>
              )}
              {pick.confidence && !confPct && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#71717a' }}>Confidence</p>
                  <p className="text-lg tracking-widest" style={{ color: '#fafafa' }}>{pick.confidence}</p>
                </div>
              )}
            </div>

            {pick.edge && (
              <p className="text-base leading-relaxed mb-8" style={{ color: '#a1a1aa' }}>
                {briefEdgeSummary(pick.edge, 3)}
              </p>
            )}

            <button
              type="button"
              onClick={() => ctaSignup('pick_unlock_analysis')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Unlock Full Analysis
            </button>
          </div>
        ) : (
          <div
            className="mx-auto max-w-2xl rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            <p className="text-lg mb-2" style={{ color: '#e4e4e7' }}>New picks publish every morning</p>
            <p className="text-sm mb-6" style={{ color: '#71717a' }}>Pacific time · Free account gets today&apos;s top pick by email</p>
            <button
              type="button"
              onClick={() => ctaSignup('pick_empty')}
              className="px-8 py-3.5 rounded-full font-semibold"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Get Today&apos;s Free Pick
            </button>
          </div>
        )}
      </section>

      {/* ── VERIFIED RESULTS ── */}
      <section id="results" className={`${PAGE} py-16 sm:py-20`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight" style={{ color: '#fafafa' }}>
          Verified results
        </h2>
        <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-3xl mx-auto text-center mb-10">
          {[
            { label: 'Win rate', val: perf.loading ? '…' : winRate },
            { label: 'Units profit', val: perf.loading ? '…' : unitsLabel },
            { label: 'Picks tracked', val: perf.loading ? '…' : picksTracked },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight" style={{ color: '#fafafa' }}>
                {val}
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-wider" style={{ color: '#71717a' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/odds?tracker=1#pick-tracker"
            className="inline-block text-sm font-medium transition-colors hover:text-white"
            style={{ color: '#a1a1aa' }}
          >
            View full results →
          </Link>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={`${PAGE} py-16 sm:py-24 pb-28`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight" style={{ color: '#fafafa' }}>
          Simple pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <div
            className="rounded-2xl p-8 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#71717a' }}>Free</p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#fafafa' }}>$0</p>
            <p className="text-sm mb-8 flex-1 leading-relaxed" style={{ color: '#a1a1aa' }}>
              Daily newsletter, today&apos;s top pick, live odds, and public tracker.
            </p>
            <button
              type="button"
              onClick={() => ctaSignup('pricing_free')}
              className="w-full py-3.5 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fafafa', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Start free
            </button>
          </div>

          <div
            className="rounded-2xl p-8 flex flex-col relative"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.14), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a1a1aa' }}>Premium</p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#fafafa' }}>{PREMIUM_PRICE_DISPLAY}</p>
            <p className="text-sm mb-8 flex-1 leading-relaxed" style={{ color: '#a1a1aa' }}>
              All 3 daily Vega picks with full write-ups and unlimited AI analysis.
            </p>
            <button
              type="button"
              onClick={() => ctaPremium('pricing_premium')}
              className="w-full py-3.5 rounded-full font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Go Premium
            </button>
          </div>

          <div
            className="rounded-2xl p-8 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#71717a' }}>Compare</p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#fafafa' }}>Plans</p>
            <p className="text-sm mb-8 flex-1 leading-relaxed" style={{ color: '#a1a1aa' }}>
              See exactly what&apos;s included in free vs Premium.
            </p>
            <Link
              to="/plans"
              onClick={() => trackEvent('welcome_cta', { action: 'plans', source: 'pricing_compare' })}
              className="w-full py-3.5 rounded-full font-semibold text-center block transition-colors hover:bg-white/10"
              style={{ color: '#fafafa', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
