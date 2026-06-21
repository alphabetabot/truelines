import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function LogoLink({
  height = 48,
  maxWidth = 220,
  className = '',
  style = {},
  theme = 'default',
}) {
  const { user } = useAuth()
  const homeTo = user ? '/odds' : '/'

  if (theme === 'marketing') {
    return (
      <Link
        to={homeTo}
        className={className}
        aria-label="TrueOddsIQ home"
        style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', ...style }}
      >
        <span
          className="font-black tracking-tight whitespace-nowrap"
          style={{ fontSize: height > 32 ? 20 : 17, color: '#fafafa', lineHeight: 1 }}
        >
          TrueOdds<span style={{ color: 'var(--green)' }}>IQ</span>
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={homeTo}
      className={className}
      aria-label="TrueOddsIQ home"
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}
    >
      <img
        src="/logo.jpg"
        alt="TrueOddsIQ"
        onError={e => {
          e.currentTarget.onerror = null
          e.currentTarget.src = '/logo.svg'
        }}
        style={{ height, width: 'auto', maxWidth, objectFit: 'contain' }}
      />
    </Link>
  )
}
