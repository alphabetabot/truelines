import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Tag, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Static evergreen posts always shown
const STATIC_POSTS = [
  {
    slug: 'how-to-shop-betting-lines',
    title: 'How to Shop Betting Lines and Save Money Every Week',
    date: '2026-04-21',
    sport: 'General',
    summary: 'Using only one sportsbook can mean accepting worse prices. Here\'s how line shopping can improve the number you get before placing a bet.',
    content: `
## What Is Line Shopping?

Line shopping means comparing odds at multiple sportsbooks before placing a bet to find the best price. Just like you'd compare prices before buying a TV, smart bettors compare lines before betting a game.

## Why It Matters More Than You Think

Here's a real example:

- **DraftKings:** Cowboys -3 (-115)
- **FanDuel:** Cowboys -3 (-108)
- **Pinnacle:** Cowboys -3 (-105)

If you bet $100 on the Cowboys spread, you need to risk $115 at DraftKings, $108 at FanDuel, or just $105 at Pinnacle to win $100.

Over a large sample of bets, consistently taking the better available price can meaningfully improve your expected return compared with always using one book.

## The Best Books to Compare

For US bettors, the main books to compare are:

1. **DraftKings** — competitive on most markets
2. **FanDuel** — often best on NFL and NBA
3. **BetMGM** — good for live betting
4. **Caesars** — strong on props
5. **Pinnacle** — the sharpest book, lowest vig

## How TrueOddsIQ Makes This Easy

Instead of opening several sportsbook apps, TrueOddsIQ shows available lines side by side from the books returned by our odds provider. Best listed odds are highlighted in green so you can quickly compare prices before deciding where to bet.

[Compare lines now at TrueOddsIQ →](https://trueoddsiq.com/compare)

## The Bottom Line

Line shopping is one of the simplest habits for getting a better price without changing your handicap. It does not guarantee profit, but it can help you avoid routinely taking worse numbers.
    `,
  },
  {
    slug: 'how-to-read-mlb-betting-odds',
    title: 'How to Read MLB Betting Odds: A Complete Beginner\'s Guide',
    date: '2026-04-21',
    sport: 'MLB',
    summary: 'Confused by moneylines, run lines, and totals? This guide breaks down every type of MLB bet in plain English so you can start betting baseball with confidence.',
    content: `
## The Three Main MLB Bet Types

### 1. Moneyline (ML)
The moneyline is simply picking which team wins. Odds are expressed as positive or negative numbers.

**Example:** Yankees -150 vs Red Sox +130

- **Yankees -150** means you bet $150 to win $100 (Yankees are favored)
- **Red Sox +130** means you bet $100 to win $130 (Red Sox are the underdog)

### 2. Run Line
The run line is baseball's version of a point spread. It's almost always set at 1.5 runs.

**Example:** Yankees -1.5 (+110) vs Red Sox +1.5 (-130)

- Bet Yankees -1.5: Yankees must win by 2+ runs
- Bet Red Sox +1.5: Red Sox can lose by 1 and you still win

### 3. Total (Over/Under)
You're betting on the combined runs scored by both teams.

**Example:** O/U 8.5

- **Over 8.5 (-110):** Both teams combine for 9+ runs
- **Under 8.5 (-110):** Both teams combine for 8 or fewer runs

## What Affects MLB Odds?

**Starting Pitchers** — The biggest factor. An ace like Paul Skenes pitching at home vs a #5 starter will dramatically shift the line.

**Ballpark** — Coors Field (Colorado) is the most hitter-friendly park. PNC Park and Petco Park play like pitchers' parks.

**Weather** — Wind blowing out at Wrigley Field? Expect the total to move up. Cold April game in Chicago? Under looks better.

**Lineup** — Missing a key bat (cleanup hitter out) will often move the total down by half a run.

## Use TrueOddsIQ for MLB Betting

TrueOddsIQ shows you:
- Current MLB odds from available sportsbooks such as DraftKings, FanDuel, BetMGM, Caesars, Pinnacle and Bet365
- Probable pitcher stats such as ERA, WHIP and K/9 when available
- Venue and weather context when available from the MLB schedule feed
- AI-assisted analysis from Vega using the current odds snapshot and available matchup context

[Check today's MLB odds →](https://trueoddsiq.com)
    `,
  },
  {
    slug: 'vega-ai-picks-how-it-works',
    title: 'How Vega\'s AI Picks Work: The Technology Behind TrueOddsIQ',
    date: '2026-04-21',
    sport: 'General',
    summary: 'TrueOddsIQ\'s AI analyst Vega uses current odds snapshots and available matchup context to generate sports betting research. Here\'s what data goes in and what does not.',
    content: `
## Who Is Vega?

Vega is TrueOddsIQ's AI sports betting analyst, powered by Claude (Anthropic). Unlike a generic chatbot, Vega is prompted to compare the current odds snapshot, available matchup context, and line-shopping differences rather than simply predicting a winner.

## What Data Does Vega Analyze?

For every game, Vega receives:

**Odds Data**
- Current moneyline, spread, and total prices from available sportsbooks
- Differences in available prices across books
- Best available price for each bet type

**MLB-Specific Data**
- Starting pitcher: name, ERA, WHIP, K/9, opponent batting average
- Venue and weather details such as temperature, wind speed and direction when available

**Sport-Specific Context**
- Team names, sport, start time, home/away matchup, and current prices
- Additional injury, betting-split, and historical line-movement feeds are not currently ingested

## How Vega Generates Picks

Vega is instructed to:
1. Compare current prices and implied probabilities across available books
2. Highlight where line shopping produces a better listed number
3. Use available matchup context while being clear about missing data
4. Avoid forcing picks when the available information is thin

## Why Two AI Models?

TrueOddsIQ offers analysis from both **Vega (Claude)** and **ChatGPT**. Different AI systems can frame the same odds snapshot in different ways, which can help you pressure-test a betting idea before making your own decision.

## The Disclaimer

Vega's picks are for informational and entertainment purposes only. AI models are powerful tools but not infallible. Always bet within your means and use Vega's analysis as one input — not your only input.

[Try Vega's analysis free →](https://trueoddsiq.com/analysis)
    `,
  },
]

function BlogCard({ post, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: '#f1f5f9', color: '#64748b' }}>
          <Tag size={10} className="inline mr-1" />{post.sport}
        </span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          <Calendar size={10} className="inline mr-1" />
          {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        {post.auto_generated && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#fef3c7', color: '#d97706' }}>
            ⚡ Daily Preview
          </span>
        )}
      </div>
      <h2 className="font-bold mb-2 leading-tight" style={{ color: '#0f172a', fontSize: '1rem' }}>
        {post.title}
      </h2>
      <p className="text-sm mb-3 leading-relaxed" style={{ color: '#64748b' }}>
        {post.summary}
      </p>
      <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#2563eb' }}>
        Read more <ChevronRight size={14} />
      </div>
    </div>
  )
}

function BlogPost({ post, onBack }) {
  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-3" style={{ color: '#0f172a' }}>{line.slice(2)}</h1>
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-6 mb-3" style={{ color: '#0f172a' }}>{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2" style={{ color: '#0f172a' }}>{line.slice(4)}</h3>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold my-2" style={{ color: '#0f172a' }}>{line.slice(2, -2)}</p>
      if (line.startsWith('- ')) return <li key={i} className="ml-4 my-1 text-sm" style={{ color: '#475569' }}>{line.slice(2)}</li>
      if (line.match(/^\[.+\]\(.+\)$/)) {
        const text = line.match(/\[(.+)\]/)?.[1]
        const url = line.match(/\((.+)\)/)?.[1]
        return <a key={i} href={url} className="block my-4 text-center py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#0f172a', textDecoration: 'none' }}>{text}</a>
      }
      if (!line.trim()) return <div key={i} className="h-2" />
      return <p key={i} className="text-sm my-2 leading-relaxed" style={{ color: '#475569' }}>{line}</p>
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-6 font-medium" style={{ color: '#2563eb' }}>
        ← Back to blog
      </button>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>
          {post.sport}
        </span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>
          {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <h1 className="mb-6" style={{ color: '#0f172a' }}>{post.title}</h1>
      <div className="p-6 rounded-2xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        {renderContent(post.content)}
      </div>
    </div>
  )
}

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState(null)
  const [dbPosts, setDbPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .order('date', { ascending: false })
          .limit(30)
        setDbPosts(data || [])
      } catch {
        setDbPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  // Check URL for slug
  useEffect(() => {
    const slug = window.location.pathname.split('/blog/')[1]
    if (slug) {
      const all = [...dbPosts, ...STATIC_POSTS]
      const post = all.find(p => p.slug === slug)
      if (post) setSelectedPost(post)
    }
  }, [dbPosts])

  // Merge: DB posts first (newest), then static evergreen posts
  const allPosts = [...dbPosts, ...STATIC_POSTS]

  if (selectedPost) {
    return (
      <div className="py-6 px-4">
        <BlogPost post={selectedPost} onBack={() => { setSelectedPost(null); navigate('/blog') }} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ color: '#0f172a' }}>Betting Insights</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Expert analysis, betting guides, and AI-powered insights from Vega
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={20} className="animate-spin" style={{ color: '#94a3b8' }} />
        </div>
      ) : (
        <div className="grid gap-4">
          {allPosts.map(post => (
            <BlogCard
              key={post.slug}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
