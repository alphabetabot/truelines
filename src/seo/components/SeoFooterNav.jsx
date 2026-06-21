import { Link } from 'react-router-dom'
import { SEO_FOOTER_SECTIONS } from '../seoNavLinks'

export default function SeoFooterNav({ variant = 'default' }) {
  const marketing = variant === 'marketing'

  return (
    <div
      className={`max-w-5xl mx-auto w-full rounded-xl ${marketing ? 'py-6 px-4 sm:px-6' : 'py-4 px-2 mb-2'}`}
      style={{
        background: marketing ? 'var(--bg-card)' : 'var(--bg-secondary)',
        border: marketing ? '1px solid var(--green-border)' : '1px solid var(--border)',
        boxShadow: marketing ? '0 8px 24px rgba(0, 0, 0, 0.35)' : undefined,
      }}
    >
      <p
        className={`font-black uppercase tracking-wider mb-3 text-center ${marketing ? 'text-sm' : 'text-xs'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        Betting guides &amp; sport pages
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {SEO_FOOTER_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{section.title}</p>
            <ul className="space-y-1">
              {section.links.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
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
