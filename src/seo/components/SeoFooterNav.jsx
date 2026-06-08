import { Link } from 'react-router-dom'
import { SEO_FOOTER_SECTIONS } from '../seoNavLinks'

export default function SeoFooterNav() {
  return (
    <div
      className="max-w-5xl mx-auto w-full py-4 px-2 mb-2 rounded-xl"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
      <p className="text-xs font-black uppercase tracking-wider mb-3 text-center" style={{ color: '#0f172a' }}>
        Betting guides &amp; sport pages
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {SEO_FOOTER_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-bold mb-2" style={{ color: '#0f172a' }}>{section.title}</p>
            <ul className="space-y-1">
              {section.links.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs font-medium hover:underline"
                    style={{ color: '#2563eb' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
