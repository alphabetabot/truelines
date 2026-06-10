import { useState, useEffect, useMemo } from 'react'
import { Trophy, Zap, Lock } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getSportsbookLink, getSportsbookLinkRel, trackSportsbookClick } from '../lib/affiliateLinks'
import { getDfsLineupKey, loadDfsLineup, saveDfsLineup } from '../lib/dfsLineupStorage'

const PREVIEW_MAX_PLAYERS = 8

const SPORTS = [
  { key: 'baseball_mlb', label: 'MLB', emoji: '⚾' },
  { key: 'basketball_nba', label: 'NBA', emoji: '🏀' },
]

const CONTEST_TYPES = [
  { key: 'cash', label: 'Cash Games', desc: 'Top 50% wins — target floor' },
  { key: 'gpp', label: 'GPP Tournaments', desc: 'High upside — swing big' },
]

const MOCK_MLB_PLAYERS = [
  { name: 'Aaron Judge', team: 'NYY', pos: 'OF', salary: 6200, projPts: 42.3, value: 6.8, ownership: 28, hotness: 'hot', reason: 'Vs LHP, 8 HR last 15 games, home park' },
  { name: 'Shohei Ohtani', team: 'LAD', pos: 'SP/OF', salary: 10500, projPts: 68.1, value: 6.5, ownership: 45, hotness: 'hot', reason: 'SP tonight, 11.2 K/9, elite matchup vs BAL' },
  { name: 'Freddie Freeman', team: 'LAD', pos: '1B', salary: 5400, projPts: 34.8, value: 6.4, ownership: 18, hotness: 'warm', reason: 'Low ownership value play, 3 hits last 3 games' },
  { name: 'Gunnar Henderson', team: 'BAL', pos: 'SS', salary: 5800, projPts: 36.2, value: 6.2, ownership: 22, hotness: 'warm', reason: 'Team stacking play, hits cleanup' },
  { name: 'Juan Soto', team: 'NYM', pos: 'OF', salary: 5900, projPts: 36.0, value: 6.1, ownership: 31, hotness: 'warm', reason: 'High OBP, favorable matchup vs RHP' },
  { name: 'Manny Machado', team: 'SD', pos: '3B', salary: 4800, projPts: 28.9, value: 6.0, ownership: 12, hotness: 'cold', reason: 'Low ownership GPP dart, vs weak SP' },
  { name: 'Yordan Alvarez', team: 'HOU', pos: 'OF', salary: 5600, projPts: 33.5, value: 6.0, ownership: 19, hotness: 'warm', reason: 'Consistent floor, minefield spot' },
  { name: 'Trea Turner', team: 'PHI', pos: 'SS', salary: 4600, projPts: 27.4, value: 5.9, ownership: 15, hotness: 'cold', reason: 'Contrarian play, due for breakout game' },
  { name: 'Paul Goldschmidt', team: 'STL', pos: '1B', salary: 4200, projPts: 24.3, value: 5.8, ownership: 8, hotness: 'cold', reason: 'Elite salary relief, fills roster spot' },
  { name: 'Gerrit Cole', team: 'NYY', pos: 'SP', salary: 9200, projPts: 52.1, value: 5.7, ownership: 33, hotness: 'hot', reason: 'Strong K upside vs weak lineup' },
]

const MOCK_NBA_PLAYERS = [
  { name: 'Nikola Jokic', team: 'DEN', pos: 'C', salary: 11200, projPts: 65.4, value: 5.8, ownership: 38, hotness: 'hot', reason: 'Triple-double machine, favorable matchup' },
  { name: 'Luka Doncic', team: 'DAL', pos: 'PG', salary: 10800, projPts: 61.2, value: 5.7, ownership: 42, hotness: 'hot', reason: '35+ pts last 4 games, pace up matchup' },
  { name: 'Jayson Tatum', team: 'BOS', pos: 'SF', salary: 9400, projPts: 52.3, value: 5.6, ownership: 25, hotness: 'warm', reason: 'Home game, usage spike with Brown out' },
  { name: 'Anthony Edwards', team: 'MIN', pos: 'SG', salary: 8600, projPts: 47.8, value: 5.6, ownership: 28, hotness: 'warm', reason: 'High usage, attacking weak perimeter D' },
  { name: 'Bam Adebayo', team: 'MIA', pos: 'C', salary: 7200, projPts: 39.5, value: 5.5, ownership: 14, hotness: 'warm', reason: 'Value C in a pace-up game' },
  { name: "De'Aaron Fox", team: 'SAC', pos: 'PG', salary: 7800, projPts: 42.1, value: 5.4, ownership: 21, hotness: 'warm', reason: 'Blowup game upside, fast pace' },
  { name: 'Draymond Green', team: 'GSW', pos: 'PF', salary: 5400, projPts: 28.4, value: 5.3, ownership: 9, hotness: 'cold', reason: 'Cheap assist/reb floor, GPP only' },
  { name: 'Tyrese Haliburton', team: 'IND', pos: 'PG', salary: 8200, projPts: 43.1, value: 5.3, ownership: 32, hotness: 'warm', reason: 'Playmaking monster, high assist ceiling' },
]

function hotColor(hotness) {
  if (hotness === 'hot') return { bg: '#fef2f2', color: '#ef4444', label: '🔥 Hot' }
  if (hotness === 'warm') return { bg: '#fefce8', color: '#ca8a04', label: '⚡ Value' }
  return { bg: '#f0fdf4', color: '#16a34a', label: '💎 Contrarian' }
}

function ValueBar({ value }) {
  const pct = Math.min((value / 10) * 100, 100)
  const color = value >= 6.5 ? '#22c55e' : value >= 5.5 ? '#f59e0b' : '#64748b'
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
    <div onClick={() => onToggle(player)} className="rounded-xl p-4 cursor-pointer transition-all"
      style={{ border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0', background: selected ? '#eff6ff' : '#fff', opacity: isGPP && player.ownership > 30 ? 0.7 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>{player.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: '#f1f5f9', color: '#475569' }}>Sample</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: hot.bg, color: hot.color }}>{hot.label}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: '#475569' }}>{player.team} · {player.pos}</span>
            <span className="text-xs" style={{ color: '#64748b' }}>{player.ownership}% owned</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{player.reason}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm" style={{ color: '#0f172a' }}>${player.salary.toLocaleString()}</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: '#2563eb' }}>{player.projPts} pts</div>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className="text-xs" style={{ color: '#64748b' }}>{player.value}x</span>
            <ValueBar value={player.value} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LineupBuilder({ players }) {
  const totalSalary = players.reduce((s, p) => s + p.salary, 0)
  const totalProj = players.reduce((s, p) => s + p.projPts, 0)
  const salaryCap = 50000
  const remaining = salaryCap - totalSalary
  return (
    <div className="rounded-2xl p-4" style={{ background: '#0f172a', color: '#fff' }}>
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} style={{ color: '#f59e0b' }} />
        <span className="font-bold text-sm">My Lineup</span>
        <span className="ml-auto text-xs" style={{ color: '#64748b' }}>{players.length} / {PREVIEW_MAX_PLAYERS}</span>
      </div>
      {players.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#475569' }}>Tap players below to add them</p>
      ) : (
        <div className="space-y-2 mb-3">
          {players.map(p => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-xs font-medium">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#64748b' }}>{p.projPts}pts</span>
                <span className="text-xs" style={{ color: '#f59e0b' }}>${p.salary.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t pt-3" style={{ borderColor: '#1e293b' }}>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: '#64748b' }}>Salary used</span>
          <span style={{ color: remaining < 0 ? '#ef4444' : '#22c55e' }}>${totalSalary.toLocaleString()} / ${salaryCap.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: '#64748b' }}>Proj. points</span>
          <span className="font-bold" style={{ color: '#2563eb' }}>{totalProj.toFixed(1)}</span>
        </div>
        {remaining < 0 && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Over salary cap by ${Math.abs(remaining).toLocaleString()}</p>}
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
  const storageKey = useMemo(() => getDfsLineupKey(user?.id, sport, contestType), [user?.id, sport, contestType])
  useEffect(() => { setLineup(loadDfsLineup(storageKey)) }, [storageKey])
  useEffect(() => { saveDfsLineup(storageKey, lineup) }, [storageKey, lineup])
  const players = sport === 'baseball_mlb' ? MOCK_MLB_PLAYERS : MOCK_NBA_PLAYERS
  const sorted = [...players].sort((a, b) => {
    if (sortBy === 'value') return b.value - a.value
    if (sortBy === 'proj') return b.projPts - a.projPts
    if (sortBy === 'salary') return a.salary - b.salary
    if (sortBy === 'ownership') return a.ownership - b.ownership
    return 0
  })
  const ranked = contestType === 'gpp' ? [...sorted].sort((a, b) => (a.ownership - b.ownership) * 0.3 + (b.value - a.value) * 0.7) : sorted
  function togglePlayer(player) {
    if (!user) { navigate('/login'); return }
    setLineup(prev => prev.find(p => p.name === player.name) ? prev.filter(p => p.name !== player.name) : prev.length < PREVIEW_MAX_PLAYERS ? [...prev, player] : prev)
  }
  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} style={{ color: '#f59e0b' }} />
          <h1 style={{ color: '#0f172a', margin: 0 }}>Fantasy & DFS Optimizer Preview</h1>
        </div>
        <p className="text-sm" style={{ color: '#475569' }}>Sample player-ranking experience while live salary, ownership, and projection feeds are being integrated.</p>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>Demo snapshot · Preview capped at {PREVIEW_MAX_PLAYERS} players per lineup</p>
      </div>
      <div className="rounded-xl p-3 mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>Preview mode: sample data only — not live DFS advice. DraftKings/FanDuel integrations are not active yet.</p>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {SPORTS.map(s => (
          <button key={s.key} type="button" onClick={() => { setSport(s.key); setLineup([]) }} className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ background: sport === s.key ? '#0f172a' : '#f1f5f9', color: sport === s.key ? '#fff' : '#475569' }}>{s.emoji} {s.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {CONTEST_TYPES.map(c => (
          <button key={c.key} type="button" onClick={() => setContestType(c.key)} className="p-3 rounded-xl text-left"
            style={{ border: contestType === c.key ? '2px solid #2563eb' : '1px solid #e2e8f0', background: contestType === c.key ? '#eff6ff' : '#fff' }}>
            <div className="font-bold text-sm mb-0.5" style={{ color: '#0f172a' }}>{c.label}</div>
            <div className="text-xs" style={{ color: '#475569' }}>{c.desc}</div>
          </button>
        ))}
      </div>
      <div className="mb-5"><LineupBuilder players={lineup} /></div>
      <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b' }}><Zap size={16} style={{ color: '#fff' }} /></div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold" style={{ color: '#f59e0b' }}>SAMPLE {contestType === 'gpp' ? 'GPP' : 'CASH'} PLAYER RANKINGS</div>
          <div className="text-xs" style={{ color: '#64748b' }}>{contestType === 'cash' ? 'Demo sort by floor & consistency' : 'Demo sort by upside & low ownership'}</div>
        </div>
        {!user ? <div className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: '#f59e0b' }}><Lock size={12} /> Sign in to build a lineup</div>
          : lineup.length > 0 ? <span className="text-xs flex-shrink-0" style={{ color: '#64748b' }}>Saved on this device</span> : null}
      </div>
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        <span className="text-xs flex-shrink-0" style={{ color: '#64748b' }}>Sort:</span>
        {['value', 'proj', 'salary', 'ownership'].map(s => (
          <button key={s} type="button" onClick={() => setSortBy(s)} className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold capitalize"
            style={{ background: sortBy === s ? '#2563eb' : '#f1f5f9', color: sortBy === s ? '#fff' : '#475569' }}>
            {s === 'proj' ? 'Proj Pts' : s === 'ownership' ? 'Low Own' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {ranked.map(player => (
          <PlayerCard key={player.name} player={player} selected={lineup.some(p => p.name === player.name)} onToggle={togglePlayer} contestType={contestType} />
        ))}
      </div>
      <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e293b)' }}>
        <div className="text-2xl mb-2">🏆</div>
        <div className="font-bold mb-1" style={{ color: '#fff' }}>DFS integrations coming soon</div>
        <p className="text-xs mb-4" style={{ color: '#64748b' }}>Verify salaries and contests on official apps before playing.</p>
        <div className="flex gap-3 justify-center">
          <a href={getSportsbookLink('draftkings')} target="_blank" rel={getSportsbookLinkRel()} onClick={() => trackSportsbookClick('draftkings', 'fantasy')} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#1a7a4a', color: '#fff', textDecoration: 'none' }}>DraftKings</a>
          <a href={getSportsbookLink('fanduel')} target="_blank" rel={getSportsbookLinkRel()} onClick={() => trackSportsbookClick('fanduel', 'fantasy')} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#1d4ed8', color: '#fff', textDecoration: 'none' }}>FanDuel</a>
        </div>
      </div>
      <p className="text-xs text-center mt-4" style={{ color: '#64748b' }}>Preview data is for demonstration only. Always gamble responsibly.</p>
    </div>
  )
}
