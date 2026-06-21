import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

const GREEN = '#39ff66'

function LogoMark({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ display: 'block' }}
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
  )
}

function LogoWordmark({ fontSize }) {
  return (
    <span
      className="font-black tracking-tight whitespace-nowrap"
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontSize,
        color: '#fafafa',
        lineHeight: 1,
      }}
    >
      <span>TrueOdds</span>
      <span style={{ color: GREEN }}>IQ</span>
    </span>
  )
}

export default function MarketingLogo({ size = 34, className = '', style = {} }) {
  const { user } = useAuth()
  const homeTo = user ? '/odds' : '/'
  const iconSize = Math.round(size * 0.85)
  const fontSize = size > 30 ? 18 : 16

  return (
    <Link
      to={homeTo}
      aria-label="TrueOddsIQ home"
      className={`inline-flex items-center gap-2.5 shrink-0 ${className}`.trim()}
      style={{ textDecoration: 'none', ...style }}
    >
      <LogoMark size={iconSize} />
      <LogoWordmark fontSize={fontSize} />
    </Link>
  )
}
