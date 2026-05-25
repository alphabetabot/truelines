import { useState } from 'react'
import { Trophy, Zap, Lock } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'

const SPORTS = [
  { key: 'baseball_mlb', label: 'MLB', emoji: '⚾' },
  { key: 'basketball_nba', label: 'NBA', emoji: '🏀' },
]

const CONTEST_TYPES = [
  { key: 'cash', label: 'Cash Games', desc: 'Top 50% wins — target floor' },
  { key: 'gpp', label: 'GPP Tournaments', desc: 'High upside — swing big' },
]

// Demo-only sample data. These rows are intentionally fictional so the preview
// cannot be mistaken for live DFS salary, projection, or ownership advice.
const MOCK_MLB_PLAYERS = [
  { name: 'Sample Slugger A', team: 'TST', pos: 'OF', salary: 6200, projPts: 42.3, value: 6.8, ownership: 28, hotness: 'hot', reason: 'Demo high-salary bat with strong projected value' },
  { name: 'Sample Ace B', team: 'TST', pos: 'SP', salary: 10500, projPts: 68.1, value: 6.5, ownership: 45, hotness: 'hot', reason: 'Demo pitcher profile with high projected strikeout upside' },
  { name: 'Sample First Base C', team: 'TST', pos: '1B', salary: 5400, projPts: 34.8, value: 6.4, ownership: 18, hotness: 'warm', reason: 'Demo mid-salary value profile' },
  { name: 'Sample Shortstop D', team: 'TST', pos: 'SS', salary: 5800, projPts: 36.2, value: 6.2, ownership: 22, hotness: 'warm', reason: 'Demo stacking profile for product display' },
  { name: 'Sample Outfielder E', team: 'TST', pos: 'OF', salary: 5900, projPts: 36.0, value: 6.1, ownership: 31, hotness: 'warm', reason: 'Demo high-floor hitter profile' },
  { name: 'Sample Third Base F', team: 'TST', pos: '3B', salary: 4800, projPts: 28.9, value: 6.0, ownership: 12, hotness: 'cold', reason: 'Demo low-ownership tournament profile' },
  { name: 'Sample Outfielder G', team: 'TST', pos: 'OF', salary: 5600, projPts: 33.5, value: 6.0, ownership: 19, hotness: 'warm', reason: 'Demo balanced salary and projection profile' },
  { name: 'Sample Shortstop H', team: 'TST', pos: 'SS', salary: 4600, projPts: 27.4, value: 5.9, ownership: 15, hotness: 'cold', reason: 'Demo contrarian profile for sorting behavior' },
  { name: 'Sample First Base I', team: 'TST', pos: '1B', salary: 4200, projPts: 24.3, value: 5.8, ownership: 8, hotness: 'cold', reason: 'Demo salary-relief profile' },
  { name: 'Sample Pitcher J', team: 'TST', pos: 'SP', salary: 9200, projPts: 52.1, value: 5.7, ownership: 33, hotness: 'hot', reason: 'Demo premium pitching profile' },
]

const MOCK_NBA_PLAYERS = [
  { name: 'Sample Center A', team: 'TST', pos: 'C', salary: 11200, projPts: 65.4, value: 5.8, ownership: 38, hotness: 'hot', reason: 'Demo premium center profile' },
  { name: 'Sample Guard B', team: 'TST', pos: 'PG', salary: 10800, projPts: 61.2, value: 5.7, ownership: 42, hotness: 'hot', reason: 'Demo high-usage guard profile' },
  { name: 'Sample Forward C', team: 'TST', pos: 'SF', salary: 9400, projPts: 52.3, value: 5.6, ownership: 25, hotness: 'warm', reason: 'Demo balanced wing profile' },
  { name: 'Sample Guard D', team: 'TST', pos: 'SG', salary: 8600, projPts: 47.8, value: 5.6, ownership: 28, hotness: 'warm', reason: 'Demo scoring guard profile' },
  { name: 'Sample Center E', team: 'TST', pos: 'C', salary: 7200, projPts: 39.5, value: 5.5, ownership: 14, hotness: 'warm', reason: 'Demo mid-tier value profile' },
  { name: 'Sample Guard F', team: 'TST', pos: 'PG', salary: 7800, projPts: 42.1, value: 5.4, ownership: 21, hotness: 'warm', reason: 'Demo tournament-upside profile' },
  { name: 'Sample Forward G', team: 'TST', pos: 'PF', salary: 5400, projPts: 28.4, value: 5.3, ownership: 9, hotness: 'cold', reason: 'Demo low-salary roster filler profile' },
  { name: 'Sample Guard H', team: 'TST', pos: 'PG', salary: 8200, projPts: 43.1, value: 5.3, ownership: 32, hotness: 'warm', reason: 'Demo assist-heavy guard profile' },
]

function hotColor(hotness) {
  if (hotness === 'hot') return { bg: '#fef2f2', color: '#ef4444', label: '🔥 Hot' }
  if (hotness === 'warm') return { bg: '#fefce8', color: '#ca8a04', label: '⚡ Value' }
  return { bg: '#f0fdf4', color: '#16a34a', label: '💎 Contrarian' }
}

function ValueBar({ value }) {
  const pct = Math.min((value / 10) * 100, 100)
  const color = value >= 6.5 ? '#22c55e' : value >= 5.5 ? '#f59e0b' : '#94a3b8'
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, width: 60 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
    </div>
  )
}

function PlayerCard({ player, selected, onToggle, contestType }) {
  const hot = hotColor(player.hotness)
  const isGPP = contestType === 'gpp'
  return (
    <div
      onClick={() => onToggle(player)}
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
        background: selected ? '#eff6ff' : '#fff',
        opacity: isGPP && player.ownership > 30 ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>{player.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: hot.bg, color: hot.color }}>{hot.label}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: '#64748b' }}>{player.team} · {player.pos}</span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>{player.ownership}% owned</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{player.reason}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm" style={{ color: '#0f172a' }}>${player.salary.toLocaleString()}</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: '#2563eb' }}>{player.projPts} pts</div>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className="text-xs" style={{ color: '#94a3b8' }}>{player.value}x</span>
            <ValueBar value={player.value} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LineupBuilder({ players, sport }) {
  const totalSalary = players.reduce((s, p) => s + p.salary, 0)
  const totalProj = players.reduce((s, p) => s + p.projPts, 0)
  const salaryCap = sport === 'baseball_mlb' ? 50000 : 50000
  const remaining = salaryCap - totalSalary

  return (
    <div className="rounded-2xl p-4" style={{ background: '#0f172a', color: '#fff' }}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} style={{ color: '#f59e0b' }} />
        <span className="font-bold text-sm">My Lineup</span>
        <span className="ml-auto text-xs" style={{ color: '#94a3b8' }}>{players.length} players</span>
      </div>
      {players.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#475569' }}>Tap players below to add them</p>
      ) : (
        <div className="space-y-2 mb-3">
          {players.map(p => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-xs font-medium">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#94a3b8' }}>{p.projPts}pts</span>
                <span className="text-xs" style={{ color: '#f59e0b' }}>${p.salary.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t pt-3" style={{ borderColor: '#1e293b' }}>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: '#94a3b8' }}>Salary used</span>
          <span style={{ color: remaining < 0 ? '#ef4444' : '#22c55e' }}>
            ${totalSalary.toLocaleString()} / ${salaryCap.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: '#94a3b8' }}>Proj. points</span>
          <span className="font-bold" style={{ color: '#2563eb' }}>{totalProj.toFixed(1)}</span>
        </div>
        {remaining < 0 && (
          <p className="text-xs mt-2" style={{ color: '#ef4444' }}>⚠️ Over salary cap by ${Math.abs(remaining).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

export default function Fantasy() {
  const [sport, setSport] = useState('baseball_mlb')
  const [contestType, setContestType] = useState('cash')
  const [lineup, setLineup] = useState([])
  const [sortBy, setSortBy] = useState('value')
  const { user } = useAuth()
  const navigate = useNavigate()

  const players = sport === 'baseball_mlb' ? MOCK_MLB_PLAYERS : MOCK_NBA_PLAYERS

  const sorted = [...players].sort((a, b) => {
    if (sortBy === 'value') return b.value - a.value
    if (sortBy === 'proj') return b.projPts - a.projPts
    if (sortBy === 'salary') return a.salary - b.salary
    if (sortBy === 'ownership') return a.ownership - b.ownership
    return 0
  })

  // In GPP, boost contrarian players
  const ranked = contestType === 'gpp'
    ? [...sorted].sort((a, b) => (a.ownership - b.ownership) * 0.3 + (b.value - a.value) * 0.7)
    : sorted

  function togglePlayer(player) {
    if (!user) { navigate('/login'); return }
    setLineup(prev =>
      prev.find(p => p.name === player.name)
        ? prev.filter(p => p.name !== player.name)
        : prev.length < 8 ? [...prev, player] : prev
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} style={{ color: '#f59e0b' }} />
          <h1 style={{ color: '#0f172a', margin: 0 }}>DFS Demo Sandbox</h1>
        </div>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Product preview using fictional sample players. Live salary, ownership, and projection feeds are not active.
        </p>
      </div>

      <div className="rounded-xl p-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
          Demo mode only: every player, salary, projection, ownership value, and ranking on this page is fictional sample data.
          Do not use this page to build lineups or make DFS entries.
        </p>
      </div>

      {/* Sport selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {SPORTS.map(s => (
          <button
            key={s.key}
            onClick={() => { setSport(s.key); setLineup([]) }}
            className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: sport === s.key ? '#0f172a' : '#f1f5f9',
              color: sport === s.key ? '#fff' : '#64748b',
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Contest type */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {CONTEST_TYPES.map(c => (
          <button
            key={c.key}
            onClick={() => setContestType(c.key)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              border: contestType === c.key ? '2px solid #2563eb' : '1px solid #e2e8f0',
              background: contestType === c.key ? '#eff6ff' : '#fff',
            }}
          >
            <div className="font-bold text-sm mb-0.5" style={{ color: '#0f172a' }}>{c.label}</div>
            <div className="text-xs" style={{ color: '#64748b' }}>{c.desc}</div>
          </button>
        ))}
      </div>

      {/* Lineup builder */}
      <div className="mb-5">
        <LineupBuilder players={lineup} sport={sport} />
      </div>

      {/* Vega's picks banner */}
      <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}>
          <Zap size={16} style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold" style={{ color: '#f59e0b' }}>SAMPLE {contestType === 'gpp' ? 'GPP' : 'CASH'} PLAYER RANKINGS</div>
          <div className="text-xs" style={{ color: '#94a3b8' }}>
            {contestType === 'cash' ? 'Demo sort by floor & consistency' : 'Demo sort by upside & low ownership'}
          </div>
        </div>
        {!user && (
          <div className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: '#f59e0b' }}>
            <Lock size={12} /> Sign in to save lineup
          </div>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        <span className="text-xs flex-shrink-0" style={{ color: '#94a3b8' }}>Sort:</span>
        {['value', 'proj', 'salary', 'ownership'].map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
            style={{
              background: sortBy === s ? '#2563eb' : '#f1f5f9',
              color: sortBy === s ? '#fff' : '#64748b',
            }}
          >
            {s === 'proj' ? 'Proj Pts' : s === 'ownership' ? 'Low Own' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="space-y-3">
        {ranked.map(player => (
          <PlayerCard
            key={player.name}
            player={player}
            selected={lineup.some(p => p.name === player.name)}
            onToggle={togglePlayer}
            contestType={contestType}
          />
        ))}
      </div>

      {/* DFS CTA */}
      <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e293b)' }}>
        <div className="text-2xl mb-2">🏆</div>
        <div className="font-bold mb-1" style={{ color: '#fff' }}>Live DFS integrations are not active</div>
        <p className="text-xs" style={{ color: '#94a3b8' }}>
          Use official DFS operators to verify salaries, contests, projections, and eligibility before playing.
        </p>
      </div>

      <p className="text-xs text-center mt-4" style={{ color: '#94a3b8' }}>
        Demo data is for product demonstration only. Always play responsibly.
      </p>
    </div>
  )
}
