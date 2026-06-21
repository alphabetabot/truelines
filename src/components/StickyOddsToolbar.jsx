import { useEffect, useRef } from 'react'
import { SPORTS } from '../lib/oddsApi'
import { trackStickySportBarShown, trackScoresTabOpen } from '../lib/analytics'

/**
 * Compact strip fixed under site header when user scrolls /odds matchup list.
 */
export default function StickyOddsToolbar({
  visible,
  sport,
  activeTab,
  onSportChange,
  onTabChange,
}) {
  const shownRef = useRef(false)

  useEffect(() => {
    if (visible && !shownRef.current) {
      shownRef.current = true
      trackStickySportBarShown()
    }
  }, [visible])

  if (!visible) return null

  const sportLabel = SPORTS.find(s => s.key === sport)?.label || 'Sport'

  return (
    <div
      className="fixed left-0 right-0 z-40"
      style={{
        top: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        className="max-w-5xl mx-auto px-3 flex items-center gap-2"
        style={{
          height: 40,
          background: 'var(--bg-elevated)',
          borderBottom: '2px solid var(--gold)',
        }}
      >
        <label className="sr-only" htmlFor="sticky-sport-select">Sport</label>
        <select
          id="sticky-sport-select"
          value={sport}
          onChange={e => onSportChange(e.target.value, 'sticky_bar')}
          className="text-xs font-bold rounded-lg px-2 py-1.5 shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: 110,
          }}
        >
          {SPORTS.map(s => (
            <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
          ))}
        </select>

        <div className="flex gap-1 flex-1 justify-end">
          {['Odds', 'Scores'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                onTabChange(tab)
                if (tab === 'Scores') trackScoresTabOpen(sport, 'odds_sticky')
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px]"
              style={{
                background: activeTab === tab ? 'var(--gold)' : 'transparent',
                color: activeTab === tab ? 'var(--text-on-cta)' : 'rgba(255,255,255,0.85)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only">Sticky toolbar: {sportLabel}, {activeTab} tab</p>
    </div>
  )
}
