import { Link } from 'react-router-dom'

export default function LogoLink({
  height = 48,
  maxWidth = 220,
  className = '',
  style = {},
}) {
  return (
    <Link
      to="/"
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
