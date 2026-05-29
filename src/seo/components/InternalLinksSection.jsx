import { Link } from 'react-router-dom'

export default function InternalLinksSection({ title = 'Explore TrueOddsIQ', links = [] }) {
  if (!links.length) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-black mb-3" style={{ color: '#0f172a' }}>{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map(({ to, label }) => (
          <Link
            key={to + label}
            to={to}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', border: '1px solid #e2e8f0' }}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  )
}
