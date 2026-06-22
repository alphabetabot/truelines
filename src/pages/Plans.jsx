import { Link, useNavigate } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"
const PAGE_PAD = 'px-6 sm:px-10 lg:px-12'
const PAGE_MAX = 'max-w-4xl mx-auto w-full'

const FREE_FEATURES = [
  { label: 'Daily newsletter', value: '1 top pick' },
  { label: 'Odds tools', value: 'Live odds · Compare' },
  { label: 'AI parlay builder', value: 'Vega-built tickets' },
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

export default function Plans() {
  const navigate = useNavigate()

  function ctaSignup(source, { premium = false } = {}) {
    trackEvent('plans_cta', { action: premium ? 'premium' : 'signup', source })
    navigate('/login', {
      state: premium ? { mode: 'signup', from: '/premium' } : { mode: 'signup' },
    })
  }

  return (
    <div
      className="w-full pb-16"
      style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}
    >
      <div className={`${PAGE_MAX} ${PAGE_PAD} pt-8 sm:pt-12`}>
        <p
          className="mb-3 font-extrabold uppercase"
          style={{ fontSize: 17, color: 'var(--text-primary)', letterSpacing: '0.14em' }}
        >
          Get started
        </p>
        <h1
          className="font-black text-3xl sm:text-4xl mb-3 uppercase"
          style={{ fontFamily: TEAM_FONT, color: 'var(--text-primary)', lineHeight: 1.1 }}
        >
          Compare Free vs Premium
        </h1>
        <p className="mb-10 max-w-2xl" style={{ fontSize: 21, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Start free with the morning newsletter and public tracker. Upgrade when you want the full daily card and unlimited AI analysis.
        </p>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Free */}
          <div
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--odds-bg-best)', border: '2px solid var(--green)' }}
          >
            <div
              className="px-6 sm:px-8 py-5"
              style={{ background: '#dcfce7', borderBottom: '2px solid #86efac' }}
            >
              <h2
                className="font-black text-xl uppercase tracking-wide"
                style={{ fontFamily: TEAM_FONT, color: 'var(--text-primary)' }}
              >
                Free account · $0
              </h2>
            </div>
            <table className="w-full flex-1" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {FREE_FEATURES.map(({ label, value }, i) => (
                  <tr
                    key={label}
                    style={{
                      background: i % 2 === 0 ? '#f0fdf4' : '#ecfdf5',
                      borderBottom: i < FREE_FEATURES.length - 1 ? '1px solid #bbf7d0' : 'none',
                    }}
                  >
                    <td
                      className="py-4 pl-6 sm:pl-8 pr-4 font-semibold"
                      style={{ fontSize: 17, color: 'var(--text-primary)', verticalAlign: 'middle' }}
                    >
                      {label}
                    </td>
                    <td
                      className="py-4 pr-6 sm:pr-8 text-right font-bold"
                      style={{ fontSize: 17, color: '#15803d', verticalAlign: 'middle' }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="px-6 sm:px-8 py-6 mt-auto"
              style={{ background: '#dcfce7', borderTop: '2px solid #86efac' }}
            >
              <button
                type="button"
                onClick={() => ctaSignup('plans_free')}
                className="w-full px-8 py-4 rounded-xl font-bold"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 21 }}
              >
                Create Free Account
              </button>
            </div>
          </div>

          {/* Premium */}
          <div
            className="rounded-2xl p-6 sm:p-8 relative flex flex-col"
            style={{
              background: 'linear-gradient(165deg, var(--bg-secondary) 0%, var(--bg-elevated) 100%)',
              border: '2px solid var(--gold)',
              boxShadow: '0 12px 40px rgba(245, 158, 11, 0.18)',
              color: 'var(--text-primary)',
            }}
          >
            <span
              className="absolute -top-2.5 right-6 text-xs font-extrabold uppercase px-2.5 py-1 rounded-md"
              style={{ background: 'var(--gold)', color: 'var(--text-primary)', letterSpacing: '0.1em' }}
            >
              Vega&apos;s Top Picks
            </span>
            <h2 className="font-black text-2xl mb-1 uppercase" style={{ fontFamily: TEAM_FONT, color: 'var(--gold)' }}>
              Premium
            </h2>
            <p className="font-bold text-xl mb-5" style={{ fontFamily: TEAM_FONT, color: '#fde68a' }}>
              {PREMIUM_PRICE_DISPLAY.replace('/mo', ' / month')}
            </p>
            {PREMIUM_FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl p-4 sm:p-5 mb-3 last:mb-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
              >
                <strong className="block font-bold mb-1.5" style={{ fontSize: 21, color: 'var(--text-primary)' }}>{f.title}</strong>
                <span style={{ fontSize: 17, color: 'var(--border)', lineHeight: 1.45 }}>{f.detail}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => ctaSignup('plans_premium', { premium: true })}
              className="w-full mt-6 py-4 rounded-xl text-center font-extrabold"
              style={{ background: 'var(--gold)', color: 'var(--text-primary)', fontSize: 21 }}
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        <p className="text-center mt-10" style={{ fontSize: 17, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign in</Link>
          {' · '}
          <Link to="/" className="font-semibold" style={{ color: 'var(--accent)' }}>Back to homepage</Link>
        </p>
      </div>
    </div>
  )
}
