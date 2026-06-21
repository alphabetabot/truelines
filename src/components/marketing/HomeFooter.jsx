import { Link, useNavigate } from 'react-router-dom'
import LogoLink from '../LogoLink'
import { trackEvent } from '../../lib/analytics'

export default function HomeFooter() {
  const navigate = useNavigate()

  function newsletterCta() {
    trackEvent('welcome_cta', { action: 'signup', source: 'footer_newsletter' })
    navigate('/login', { state: { mode: 'signup' } })
  }

  return (
    <footer style={{ background: '#020617', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <LogoLink height={28} theme="marketing" />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#71717a' }}>
              AI-powered sports betting picks backed by real data, sharp money tracking, and transparent results.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#a1a1aa' }}>Picks</p>
            <ul className="space-y-2 text-sm" style={{ color: '#71717a' }}>
              <li><Link to="/picks" className="hover:text-white transition-colors">Today&apos;s Picks</Link></li>
              <li><Link to="/odds?tracker=1#pick-tracker" className="hover:text-white transition-colors">Track Record</Link></li>
              <li><Link to="/premium" className="hover:text-white transition-colors">Premium Picks</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#a1a1aa' }}>Company</p>
            <ul className="space-y-2 text-sm" style={{ color: '#71717a' }}>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><a href="mailto:info@trueoddsiq.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#a1a1aa' }}>Resources</p>
            <ul className="space-y-2 text-sm" style={{ color: '#71717a' }}>
              <li><Link to="/odds" className="hover:text-white transition-colors">Live Odds</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Line Compare</Link></li>
              <li><Link to="/plans" className="hover:text-white transition-colors">Compare Plans</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#a1a1aa' }}>
              Daily picks by email
            </p>
            <p className="text-sm mb-4" style={{ color: '#71717a' }}>
              Free pick every morning. No credit card.
            </p>
            <button
              type="button"
              onClick={newsletterCta}
              className="w-full py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#fafafa', color: '#09090b' }}
            >
              Subscribe free
            </button>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}
        >
          <span>© {new Date().getFullYear()} TrueOddsIQ. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <Link to="/disclaimer" className="hover:text-zinc-400 transition-colors">Responsible Gaming</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
