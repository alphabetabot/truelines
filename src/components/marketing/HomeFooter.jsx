import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trackEvent } from '../../lib/analytics'

const GREEN = '#39ff66'

export default function HomeFooter() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  function newsletterSubmit(e) {
    e.preventDefault()
    trackEvent('welcome_cta', { action: 'signup', source: 'footer_newsletter' })
    navigate('/login', { state: { mode: 'signup', email: email.trim() || undefined } })
  }

  return (
    <footer style={{ background: '#000000', borderTop: '1px solid rgba(57, 255, 100, 0.08)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Picks</p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <li><Link to="/picks" className="hover:text-white transition-colors">Today&apos;s Picks</Link></li>
              <li><Link to="/odds?tracker=1#pick-tracker" className="hover:text-white transition-colors">Track Record</Link></li>
              <li><Link to="/premium" className="hover:text-white transition-colors">Premium Picks</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Company</p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><a href="mailto:info@trueoddsiq.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Resources</p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <li><Link to="/odds" className="hover:text-white transition-colors">Live Odds</Link></li>
              <li><Link to="/compare" className="hover:text-white transition-colors">Line Compare</Link></li>
              <li><Link to="/plans" className="hover:text-white transition-colors">Compare Plans</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GREEN }}>
              Get picks in your inbox
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Free daily pick every morning. No credit card.
            </p>
            <form onSubmit={newsletterSubmit} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fafafa',
                }}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: GREEN, color: '#0a0a0a' }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
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
