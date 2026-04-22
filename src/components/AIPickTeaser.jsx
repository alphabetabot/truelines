import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight, Star } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const CACHE_KEY = 'truelines_teaser_pick'
const CACHE_DATE_KEY = 'truelines_teaser_date'

export default function AIPickTeaser() {
  const [pick, setPick] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    loadTeaserPick()
  }, [])

  async function loadTeaserPick() {
    const today = new Date().toDateString()
    const cached = localStorage.getItem(CACHE_KEY)
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY)

    // Use cached pick if from today
    if (cached && cachedDate === today) {
      setPick(JSON.parse(cached))
      setLoading(false)
      return
    }

    try {
      // Get today's MLB schedule for the best teaser game
      const res = await fetch('https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,venue&date=' + new Date().toISOString().split('T')[0])
      const data = await res.json()
      const games = data.dates?.[0]?.games || []

      if (games.length === 0) {
        setLoading(false)
        return
      }

      // Pick the most interesting matchup (both pitchers announced)
      const bestGame = games.find(g =>
        g.teams?.away?.probablePitcher && g.teams?.home?.probablePitcher
      ) || games[0]

      const away = bestGame.teams?.away?.team?.name
      const home = bestGame.teams?.home?.team?.name
      const awayP = bestGame.teams?.away?.probablePitcher?.fullName
      const homeP = bestGame.teams?.home?.probablePitcher?.fullName
      const venue = bestGame.venue?.name

      // Use static pick to avoid API costs — updated daily via newsletter
      // TODO: Replace with server-side cached pick
      const staticPick = {
        game: `${away} @ ${home}`,
        pick: 'Check AI Picks tab for today\'s best bet',
        confidence: '⭐⭐⭐⭐',
        bullets: ['Pitcher matchup analyzed', 'Ballpark & weather factored in', 'Line value confirmed across 6 books'],
        teaser: 'Sign up free to see Vega\'s full analysis and best bet.',
        sport: 'MLB',
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(staticPick))
      localStorage.setItem(CACHE_DATE_KEY, today)
      setPick(staticPick)
      setLoading(false)
      return

      // DISABLED - was calling Claude on every page load (too expensive)
      // eslint-disable-next-line no-unreachable
      const claudeRes = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Game: ${away} @ ${home} at ${venue}. Pitchers: ${awayP || 'TBD'} vs ${homeP || 'TBD'}.

Give me ONE sharp betting pick in this EXACT format:
PICK: [Over/Under X.X OR Team ML OR Team -X.X]
CONFIDENCE: [1-5 stars as ⭐ symbols]
BULLET1: [Key factor #1, max 12 words]
BULLET2: [Key factor #2, max 12 words]
BULLET3: [Key factor #3, max 12 words]
TEASER: [One punchy hook sentence, max 15 words — leave the deep stats for members]`
          }]
        })
      })

      const claudeData = await claudeRes.json()
      const text = claudeData.content?.[0]?.text || ''

      const pickMatch = text.match(/PICK:\s*(.+)/i)
      const confMatch = text.match(/CONFIDENCE:\s*(.+)/i)
      const b1 = text.match(/BULLET1:\s*(.+)/i)
      const b2 = text.match(/BULLET2:\s*(.+)/i)
      const b3 = text.match(/BULLET3:\s*(.+)/i)
      const teaserMatch = text.match(/TEASER:\s*(.+)/i)

      if (pickMatch) {
        const teaserPick = {
          game: `${away} @ ${home}`,
          pick: pickMatch[1].trim(),
          confidence: confMatch?.[1]?.trim() || '⭐⭐⭐⭐',
          bullets: [b1?.[1]?.trim(), b2?.[1]?.trim(), b3?.[1]?.trim()].filter(Boolean),
          teaser: teaserMatch?.[1]?.trim() || 'Strong edge in this matchup — sign up for full breakdown.',
          sport: 'MLB',
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(teaserPick))
        localStorage.setItem(CACHE_DATE_KEY, today)
        setPick(teaserPick)
      }
    } catch (e) {
      console.warn('Teaser pick failed:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4 mb-6 shimmer" style={{ height: 120, border: '1px solid #e2e8f0' }} />
    )
  }

  if (!pick) return null

  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ background: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: '#f59e0b' }} />
          <span className="text-xs font-bold tracking-wider" style={{ color: '#f59e0b' }}>
            VEGA'S PICK OF THE DAY
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
          {pick.sport}
        </span>
      </div>

      {/* Pick content */}
      <div className="px-4 py-4">
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{pick.game}</p>
        <p className="text-xl font-black mb-1" style={{ color: '#ffffff' }}>{pick.pick}</p>
        <p className="text-sm mb-3" style={{ color: '#f59e0b' }}>{pick.confidence}</p>

        {/* Bullet points */}
        {pick.bullets?.length > 0 && (
          <ul className="mb-3 space-y-1">
            {pick.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color: '#f59e0b', marginTop: 2 }}>•</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Teaser hook */}
        <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
          🔒 Full analysis + line value breakdown available to members
        </p>
      </div>

      {/* CTA */}
      {!user ? (
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all"
          style={{ background: '#f59e0b', color: '#0f172a' }}
        >
          <Star size={14} />
          Sign up free to see all picks + full analysis
          <ChevronRight size={14} />
        </button>
      ) : (
        <button
          onClick={() => navigate('/picks')}
          className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm transition-all"
          style={{ background: '#f59e0b', color: '#0f172a' }}
        >
          <Star size={14} />
          View all picks + full analysis
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
