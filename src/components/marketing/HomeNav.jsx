import { useNavigate } from 'react-router-dom'
import MarketingLogo from './MarketingLogo'

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

  return (
    <nav
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(57, 255, 100, 0.1)',
      }}
    >
      <div className="relative max-w-6xl mx-auto w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 min-w-0">
        <MarketingLogo size={32} className="min-w-0 shrink-0" />

        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          {LINKS.map(({ label, id }) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToId(id)}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{
              background: 'transparent',
              color: '#fafafa',
              border: '1px solid rgba(255,255,255,0.22)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="inline-flex px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #f5b800 0%, #e8a317 100%)',
              color: '#0a0a0a',
              border: 'none',
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  )
}
