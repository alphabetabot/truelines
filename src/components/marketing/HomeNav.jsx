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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <MarketingLogo size={34} />

        <div className="hidden md:flex items-center justify-center gap-8">
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-opacity hover:opacity-90"
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
            className="inline-flex px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-opacity hover:opacity-90"
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
