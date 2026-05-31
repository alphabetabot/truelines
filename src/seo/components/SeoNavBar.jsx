import { NavLink, useMatch } from 'react-router-dom'
import { SEO_NAV_HUBS } from '../seoNavLinks'
import { SEO_SPORT_SLUGS, SEO_SPORTS } from '../seoContent'

const linkClass = ({ isActive }) =>
  `flex items-center px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all shrink-0 ${
    isActive ? 'bg-[#f59e0b] text-[#0f172a]' : 'text-[rgba(255,255,255,0.75)] hover:text-white'
  }`

const linkStyle = { fontSize: 12 }

function NavItem({ to, label, isActive: isActiveOverride }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => linkClass({ isActive: isActiveOverride ?? isActive })}
      style={linkStyle}
    >
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

function SportNavItem({ slug }) {
  const sport = SEO_SPORTS[slug]
  const onOdds = Boolean(useMatch({ path: `/odds/${slug}`, end: true }))
  const onPicks = Boolean(useMatch({ path: `/picks/${slug}`, end: true }))

  return (
    <NavItem
      to={`/odds/${slug}`}
      label={sport.label}
      isActive={onOdds || onPicks}
    />
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
            <SportNavItem key={slug} slug={slug} />
          ))}
        </div>
      </div>
    </div>
  )
}
