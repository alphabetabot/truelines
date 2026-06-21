import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain, TrendingUp, BarChart2, Check, Lock, Trophy, LineChart, Target, Shield,
} from 'lucide-react'
import { usePickPerformance } from '../hooks/usePickPerformance'
import { trackEvent } from '../lib/analytics'
import { briefEdgeSummary } from '../lib/pickText'
import HomeNav from '../components/marketing/HomeNav'
import HomeFooter from '../components/marketing/HomeFooter'

const PAGE = 'max-w-6xl mx-auto w-full px-4 sm:px-6'
const VEGA_IMAGE = '/realvega.jpeg'
const GREEN = '#39ff66'
const GOLD = '#f5b800'

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
  return match ? `+${match[1]}%` : null
}

function edgeBullets(edge, max = 3) {
  if (!edge) return []
  const text = briefEdgeSummary(edge, max)
  return text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, max)
}

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm" style={{ color: '#a3a3a3' }}>
      <Check size={16} className="shrink-0 mt-0.5" style={{ color: GREEN }} />
      <span>{children}</span>
    </li>
  )
}

function VegaHeroImage({ compact = false }) {
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: compact ? 320 : 480 }}>
      <div
        className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(57,255,100,0.4) 0%, transparent 70%)' }}
        aria-hidden
      />
      <img
        src={VEGA_IMAGE}
        alt="Vega AI Sports Analyst"
        className="relative w-full h-auto rounded-xl mx-auto"
        style={{
          maxHeight: compact ? 240 : 'min(70vh, 560px)',
          objectFit: 'contain',
          objectPosition: 'center top',
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
        }}
      />
    </div>
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

  const winRate = perf.hasRecord && perf.winRate != null ? `${perf.winRate}%` : '—'
  const unitsLabel = perf.hasRecord && !perf.error
    ? `${perf.totalUnits > 0 ? '+' : ''}${perf.totalUnits.toFixed(1)}`
    : '—'
  const picksTracked = perf.hasRecord && !perf.error ? String(perf.gradedCount) : '—'
  const recordLabel = perf.hasRecord && !perf.error ? `${perf.wins}–${perf.losses}` : '—'

  const edgePct = pick ? edgePercentFromText(pick.edge) : null
  const confPct = pick ? confidencePercent(pick.confidence) : null
  const bullets = pick ? edgeBullets(pick.edge) : []

  return (
    <div
      className="w-full text-white min-h-screen pb-28"
      style={{
        fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#060606',
      }}
    >
      <HomeNav />

      {/* ── HERO ── */}
      <header
        className={`${PAGE} pt-10 pb-14 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20`}
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(57, 255, 100, 0.08), transparent 60%)',
        }}
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-6 items-center">
          <div>
            <h1
              className="font-black leading-[1.08] tracking-tight mb-5 text-center lg:text-left"
              style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)' }}
            >
              <span style={{ color: '#fafafa' }}>Smarter Bets.</span>
              <br />
              <span style={{ color: '#fafafa' }}>Real Edge.</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #39ff66 0%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Real Profits.
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 text-center lg:text-left" style={{ color: '#a3a3a3' }}>
              Daily sports betting picks powered by AI analysis, sharp money tracking,
              injury intelligence, and real sportsbook data.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => ctaSignup('hero_free_pick')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm sm:text-base transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #e8a317 100%)`, color: '#0a0a0a' }}
              >
                Get Today&apos;s Free Pick →
              </button>
              <button
                type="button"
                onClick={() => scrollToId('top-pick')}
                className="px-6 py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-colors hover:bg-white/5"
                style={{ color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                See How It Works
              </button>
            </div>

            {/* Mobile: Vega before feature list so image isn't buried */}
            <div className="flex justify-center mb-8 lg:hidden">
              <VegaHeroImage compact />
            </div>

            <div className="hidden lg:flex flex-row flex-wrap gap-6 sm:gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(57, 255, 100, 0.1)', border: '1px solid rgba(57, 255, 100, 0.2)' }}>
                  <Brain size={18} style={{ color: GREEN }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d4' }}>AI-Powered Analysis</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(57, 255, 100, 0.1)', border: '1px solid rgba(57, 255, 100, 0.2)' }}>
                  <TrendingUp size={18} style={{ color: GREEN }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d4' }}>Sharp Money Tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(57, 255, 100, 0.1)', border: '1px solid rgba(57, 255, 100, 0.2)' }}>
                  <BarChart2 size={18} style={{ color: GREEN }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#d4d4d4' }}>Live Odds From 6 Books</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex justify-center lg:justify-end">
            <VegaHeroImage />
          </div>
        </div>
      </header>

      {/* ── TODAY'S TOP PICK ── */}
      <section id="top-pick" className={`${PAGE} py-14 sm:py-20`}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] mb-10" style={{ color: GREEN }}>
          Today&apos;s Top Pick
        </p>

        {pickLoading ? (
          <div className="rounded-2xl animate-pulse h-64" style={{ background: 'rgba(57,255,100,0.04)' }} />
        ) : pick ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
              border: '1px solid rgba(57, 255, 100, 0.2)',
              boxShadow: '0 0 40px rgba(57, 255, 100, 0.06)',
            }}
          >
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#737373' }}>
                  {pick.sport}
                </p>
                <p className="text-xl font-bold mb-1" style={{ color: '#fafafa' }}>{pick.pick}</p>
                <p className="text-sm mb-6" style={{ color: '#a3a3a3' }}>{pick.game}</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#737373' }}>Edge</p>
                    <p className="text-lg font-bold" style={{ color: GREEN }}>{edgePct || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#737373' }}>Confidence</p>
                    <p className="text-lg font-bold" style={{ color: '#fafafa' }}>{confPct != null ? `${confPct}%` : pick.confidence || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm font-bold mb-4" style={{ color: '#fafafa' }}>Why we like it:</p>
                <ul className="space-y-3">
                  {bullets.length > 0 ? bullets.map(line => (
                    <CheckItem key={line}>{line}</CheckItem>
                  )) : (
                    <>
                      <CheckItem>Backed by live sportsbook odds data</CheckItem>
                      <CheckItem>AI analysis from Vega on matchup context</CheckItem>
                      <CheckItem>Graded publicly after the game finishes</CheckItem>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(57,255,100,0.1)', border: '1px solid rgba(57,255,100,0.3)' }}
                >
                  <Lock size={24} style={{ color: GREEN }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#fafafa' }}>Locked</p>
                <p className="text-xs mb-5 max-w-[200px] leading-relaxed" style={{ color: '#737373' }}>
                  Unlock full analysis, player props &amp; best bets
                </p>
                <button
                  type="button"
                  onClick={() => ctaSignup('pick_unlock')}
                  className="text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ color: GREEN, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Get Free Pick →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ border: '1px solid rgba(57,255,100,0.15)', background: 'rgba(57,255,100,0.03)' }}
          >
            <p className="text-lg font-semibold mb-2" style={{ color: '#fafafa' }}>Picks publish every morning</p>
            <p className="text-sm mb-6" style={{ color: '#737373' }}>Pacific time · Sign up free to get today&apos;s pick by email</p>
            <button
              type="button"
              onClick={() => ctaSignup('pick_empty')}
              className="px-6 py-3 rounded-lg font-bold"
              style={{ background: GREEN, color: '#0a0a0a' }}
            >
              Get Today&apos;s Free Pick
            </button>
          </div>
        )}
      </section>

      {/* ── VERIFIED RESULTS ── */}
      <section id="results" className={`${PAGE} py-14 sm:py-20`}>
        <p className="text-center text-sm font-bold uppercase tracking-[0.2em] mb-12" style={{ color: GREEN }}>
          Our Picks. Verified. Transparent.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(57,255,100,0.08)', border: '1px solid rgba(57,255,100,0.15)' }}>
              <Trophy size={22} style={{ color: GREEN }} />
            </div>
            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#fafafa' }}>{perf.loading ? '…' : winRate}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#737373' }}>Win Rate</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(57,255,100,0.08)', border: '1px solid rgba(57,255,100,0.15)' }}>
              <LineChart size={22} style={{ color: GREEN }} />
            </div>
            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#fafafa' }}>{perf.loading ? '…' : unitsLabel}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#737373' }}>Units Profit</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(57,255,100,0.08)', border: '1px solid rgba(57,255,100,0.15)' }}>
              <Target size={22} style={{ color: GREEN }} />
            </div>
            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#fafafa' }}>{perf.loading ? '…' : picksTracked}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#737373' }}>Picks Tracked</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(57,255,100,0.08)', border: '1px solid rgba(57,255,100,0.15)' }}>
              <Shield size={22} style={{ color: GREEN }} />
            </div>
            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#fafafa' }}>{perf.loading ? '…' : recordLabel}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#737373' }}>W–L Record</p>
          </div>
        </div>
        <div className="text-center">
          <Link
            to="/odds?tracker=1#pick-tracker"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            View Full Track Record →
          </Link>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={`${PAGE} py-14 sm:py-20`}>
        <h2 className="text-center text-2xl sm:text-3xl font-black mb-12" style={{ color: '#fafafa' }}>
          Choose Your Edge
        </h2>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-7 flex flex-col"
            style={{ background: '#0c0c0c', border: '1px solid rgba(57,255,100,0.15)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GREEN }}>Free</p>
            <p className="text-3xl font-black mb-6" style={{ color: '#fafafa' }}>
              $0 <span className="text-base font-normal" style={{ color: '#737373' }}>/mo</span>
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
              className="w-full py-3 rounded-lg font-bold transition-opacity hover:opacity-90"
              style={{ background: GREEN, color: '#0a0a0a' }}
            >
              Get Free Pick
            </button>
          </div>

          <div
            className="rounded-2xl p-7 flex flex-col relative"
            style={{
              background: 'linear-gradient(180deg, #141410 0%, #0c0c0c 100%)',
              border: `2px solid ${GOLD}`,
              boxShadow: '0 0 32px rgba(245, 184, 0, 0.12)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>Premium</p>
            <p className="text-3xl font-black mb-6" style={{ color: '#fafafa' }}>
              $19.95 <span className="text-base font-normal" style={{ color: '#737373' }}>/mo</span>
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                '3 premium picks daily',
                'Full AI analysis & write-ups',
                'Sharp money & injury reports',
                'Closing line value tracking',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: '#a3a3a3' }}>
                  <Check size={16} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => ctaPremium('pricing_premium')}
              className="w-full py-3 rounded-lg font-bold transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #e8a317 100%)`, color: '#0a0a0a' }}
            >
              Get Premium
            </button>
          </div>

          <div
            className="rounded-2xl p-7 flex flex-col items-center text-center"
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mt-2"
              style={{ border: '1px solid rgba(57,255,100,0.2)', background: 'rgba(57,255,100,0.05)' }}
            >
              <BarChart2 size={28} style={{ color: GREEN }} />
            </div>
            <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: '#a3a3a3' }}>
              Not sure which plan is right for you? Compare features side-by-side and choose what fits your betting style.
            </p>
            <Link
              to="/plans"
              onClick={() => trackEvent('welcome_cta', { action: 'plans', source: 'pricing_compare' })}
              className="w-full py-3 rounded-lg font-semibold text-center block transition-colors hover:bg-white/5"
              style={{ color: '#e5e5e5', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Compare Plans →
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
