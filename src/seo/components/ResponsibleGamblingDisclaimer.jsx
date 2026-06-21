import { RESPONSIBLE_GAMBLING_SEO } from '../seoContent'

export default function ResponsibleGamblingDisclaimer({ className = 'mb-6' }) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{ background: 'var(--odds-bg-best)', border: '1px solid #bbf7d0' }}
    >
      <p className="text-xs font-bold mb-1" style={{ color: '#15803d' }}>
        Responsible gambling · 21+ where legal
      </p>
      <p className="text-sm leading-relaxed" style={{ color: '#166534' }}>
        {RESPONSIBLE_GAMBLING_SEO}
      </p>
      <p className="text-xs mt-2" style={{ color: '#166534' }}>
        Gambling problem? Call{' '}
        <a href="tel:1-800-426-2537" className="font-bold underline">
          1-800-GAMBLER
        </a>
        .
      </p>
    </div>
  )
}
