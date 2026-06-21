import { Link } from 'react-router-dom'

export default function SEOHero({ title, subtitle, primaryCta, secondaryCta }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-base leading-relaxed mb-6 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {primaryCta && (
          <Link
            to={primaryCta.to}
            className="px-5 py-2.5 rounded-xl text-sm font-black"
            style={{ background: 'var(--gold)', color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            {primaryCta.label}
          </Link>
        )}
        {secondaryCta && (
          <Link
            to={secondaryCta.to}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', textDecoration: 'none' }}
          >
            {secondaryCta.label}
          </Link>
        )}
      </div>
    </header>
  )
}
