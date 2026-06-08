import { Link } from 'react-router-dom'
import { SEO_FOOTER_SECTIONS } from '../seoNavLinks'

export default function SeoFooterNav({ variant = 'default' }) {
  const marketing = variant === 'marketing'

  return (
    <div
      className={`max-w-5xl mx-auto w-full rounded-xl ${marketing ? 'py-6 px-4 sm:px-6' : 'py-4 px-2 mb-2'}`}
      style={{
        background: marketing ? '#fff' : '#f8fafc',
        border: marketing ? '2px solid #0f172a' : '1px solid #e2e8f0',
        boxShadow: marketing ? '0 8px 24px rgba(15, 23, 42, 0.08)' : undefined,
      }}
    >
      <p
        className={`font-black uppercase tracking-wider mb-3 text-center ${marketing ? 'text-sm' : 'text-xs'}`}
        style={{ color: '#0f172a' }}
      >
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
