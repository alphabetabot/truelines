import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

const GREEN = '#39ff66'

export default function MarketingLogo({ size = 34 }) {
  const { user } = useAuth()
  const homeTo = user ? '/odds' : '/'
  const iconSize = Math.round(size * 0.85)
  const fontSize = size > 30 ? 18 : 16

  return (
    <Link
      to={homeTo}
      aria-label="TrueOddsIQ home"
      className="inline-flex items-center gap-2.5 shrink-0"
      style={{ textDecoration: 'none' }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        <path
          d="M16 4L26 10V22L16 28L6 22V10L16 4Z"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 4V16M16 16L26 10M16 16L6 10M16 16V28"
          stroke={GREEN}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <circle cx="16" cy="16" r="2" fill={GREEN} />
      </svg>
      <span
        className="font-bold tracking-tight whitespace-nowrap"
        style={{ fontSize, color: '#fafafa', lineHeight: 1 }}
      >
        TrueOdds<span style={{ color: GREEN }}>IQ</span>
      </span>
    </Link>
  )
}
