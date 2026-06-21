import { useNavigate } from 'react-router-dom'
import LogoLink from '../LogoLink'
import { trackEvent } from '../../lib/analytics'

const LINKS = [
  { label: 'Today\'s Pick', id: 'top-pick' },
  { label: 'How It Works', id: 'how-it-works' },
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
        background: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <LogoLink height={34} theme="marketing" />

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map(({ label, id }) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToId(id)}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-semibold transition-colors hover:bg-white/5"
            style={{ color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={ctaSignup}
            className="px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: '#fafafa', color: '#09090b' }}
          >
            Get Free Pick
          </button>
        </div>
      </div>
    </nav>
  )
}
