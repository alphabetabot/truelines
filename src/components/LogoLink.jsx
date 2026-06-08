import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function LogoLink({
  height = 48,
  maxWidth = 220,
  className = '',
  style = {},
}) {
  const { user } = useAuth()
  const homeTo = user ? '/picks' : '/'

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
