import { SPORTS } from '../lib/oddsApi'

export default function SportSelector({ selected, onChange }) {
  return (
    <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
      {SPORTS.map(sport => (
        <button
          key={sport.key}
          onClick={() => onChange(sport.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all"
          style={{
            background: selected === sport.key ? 'var(--accent)' : 'var(--bg-card)',
            color: selected === sport.key ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${selected === sport.key ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <span style={{ fontSize: 13 }}>{sport.icon}</span>
          {sport.label}
        </button>
      ))}
    </div>
  )
}
