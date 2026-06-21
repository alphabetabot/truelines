import { useNavigate } from 'react-router-dom'
import MarketingLogo from './MarketingLogo'
import { trackEvent } from '../../lib/analytics'

const GOLD = '#f5b800'

const LINKS = [
  { label: 'Picks', id: 'top-pick' },
  { label: 'How It Works', id: 'top-pick' },
  { label: 'Results', id: 'results' },
  { label: 'Pricing', id: 'pricing' },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function HomeNav() {
  const navigate = useNavigate()

  function ctaSignup() {
    trackEvent('welcome_cta', { action: 'signup', source: 'nav_free_pick' })
    navigate('/login', { state: { mode: 'signup' } })
  }

  return (
    <nav
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(57, 255, 100, 0.1)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <MarketingLogo size={34} />

        <div className="hidden md:flex items-center justify-center gap-8">
          {LINKS.map(({ label, id }) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToId(id)}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#a3a3a3', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors hover:bg-white/5 whitespace-nowrap"
            style={{ color: '#e5e5e5', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={ctaSignup}
            className="px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #e8a317 100%)`, color: '#0a0a0a' }}
          >
            Get Today&apos;s Free Pick
          </button>
        </div>
      </div>
    </nav>
  )
}
