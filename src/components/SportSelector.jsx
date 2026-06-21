import { SPORTS } from '../lib/oddsApi'

export default function SportSelector({ selected, onChange, bright = false }) {
  return (
    <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1" style={{ paddingLeft: 2, paddingRight: 2 }}>
      {SPORTS.map(sport => (
        <button
          key={sport.key}
          onClick={() => onChange(sport.key)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all"
          style={{
            background: selected === sport.key ? 'var(--gold)' : 'var(--bg-card)',
            color: selected === sport.key ? 'var(--text-on-cta)' : bright ? 'var(--text-primary)' : 'var(--text-muted)',
            border: `1.5px solid ${selected === sport.key ? 'var(--gold)' : 'var(--border)'}`,
            fontSize: bright ? 14 : 13,
            fontWeight: selected === sport.key ? 700 : 500,
            boxShadow: selected === sport.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          <span style={{ fontSize: bright ? 15 : 14 }}>{sport.icon}</span>
          {sport.label}
        </button>
      ))}
    </div>
  )
}
