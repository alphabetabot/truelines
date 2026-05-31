import { NavLink } from 'react-router-dom'
import { SEO_NAV_HUBS } from '../seoNavLinks'
import { SEO_SPORT_SLUGS, SEO_SPORTS } from '../seoContent'

const linkClass = ({ isActive }) =>
  `flex items-center px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all shrink-0 ${
    isActive ? 'bg-[#f59e0b] text-[#0f172a]' : 'text-[rgba(255,255,255,0.75)] hover:text-white'
  }`

const linkStyle = { fontSize: 12 }

function NavItem({ to, label }) {
  return (
    <NavLink to={to} className={linkClass} style={linkStyle}>
      {label}
    </NavLink>
  )
}

function Divider() {
  return (
    <span
      className="shrink-0 mx-1"
      style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }}
      aria-hidden
    />
  )
}

/** One league label with Odds + Picks links (avoids duplicating MLB NBA NFL NHL). */
function SportNavGroup({ slug }) {
  const sport = SEO_SPORTS[slug]
  return (
    <div
      className="flex items-center shrink-0 gap-0.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      role="group"
      aria-label={`${sport.label} odds and picks`}
    >
      <span
        className="pl-2 pr-0.5 py-1 text-xs font-extrabold"
        style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}
      >
        {sport.label}
      </span>
      <NavItem to={`/odds/${slug}`} label="Odds" />
      <NavItem to={`/picks/${slug}`} label="Picks" />
    </div>
  )
}

export default function SeoNavBar() {
  return (
    <div style={{ background: '#172033', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto px-3">
        <div
          className="flex items-center gap-1 py-1.5 overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
        >
          {SEO_NAV_HUBS.map(item => (
            <NavItem key={item.to} to={item.to} label={item.shortLabel || item.label} />
          ))}
          <Divider />
          {SEO_SPORT_SLUGS.map(slug => (
            <SportNavGroup key={slug} slug={slug} />
          ))}
        </div>
      </div>
    </div>
  )
}
