import { SPORTS } from '../lib/oddsApi'

export default function SportSelector({ selected, onChange }) {
  return (
    <div className="flex items-center gap-0 mb-4 overflow-x-auto"
      style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--border)', padding: 4 }}>
      {SPORTS.map(sport => (
        <button
          key={sport.key}
          onClick={() => onChange(sport.key)}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
          style={{
            background: selected === sport.key ? 'var(--accent)' : 'transparent',
            color: selected === sport.key ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <span>{sport.icon}</span>
          {sport.label}
        </button>
      ))}
    </div>
  )
}
