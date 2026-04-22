import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Tag } from 'lucide-react'

// Blog posts are stored here — add new ones at the top
export const BLOG_POSTS = [
  {
    slug: 'how-to-shop-betting-lines',
    title: 'How to Shop Betting Lines and Save Money Every Week',
    date: '2026-04-21',
    sport: 'General',
    summary: 'Most bettors lose money not because they pick wrong — but because they use only one sportsbook. Here\'s how line shopping can add hundreds of dollars to your bottom line.',
    content: `
## What Is Line Shopping?

Line shopping means comparing odds at multiple sportsbooks before placing a bet to find the best price. Just like you'd compare prices before buying a TV, smart bettors compare lines before betting a game.

## Why It Matters More Than You Think

Here's a real example:

- **DraftKings:** Cowboys -3 (-115)
- **FanDuel:** Cowboys -3 (-108)  
- **Pinnacle:** Cowboys -3 (-105)

If you bet $100 on the Cowboys spread, you need to risk $115 at DraftKings, $108 at FanDuel, or just $105 at Pinnacle to win $100.

Over 500 bets a year, that difference adds up to **$500+ in savings** — just from shopping lines.

## The Best Books to Compare

For US bettors, the main books to compare are:

1. **DraftKings** — competitive on most markets
2. **FanDuel** — often best on NFL and NBA
3. **BetMGM** — good for live betting
4. **Caesars** — strong on props
5. **Pinnacle** — the sharpest book, lowest vig

## How TrueOddsIQ Makes This Easy

Instead of opening 6 different apps, TrueOddsIQ shows you all lines side by side in real time. Best odds are highlighted in green so you know exactly where to bet in seconds.

[Compare lines now at TrueOddsIQ →](https://trueoddsiq.com/compare)

## The Bottom Line

Line shopping is the single easiest way to improve your sports betting results without changing how you pick games. If you're not doing it, you're leaving real money on the table every week.
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
- Live MLB odds across DraftKings, FanDuel, BetMGM, Caesars, Pinnacle & Bet365
- Starting pitcher stats (ERA, WHIP, K/9) for each game
- Ballpark factors and weather conditions
- AI analysis from Vega on every matchup

[Check today's MLB odds →](https://trueoddsiq.com)
    `,
  },
  {
    slug: 'vega-ai-picks-how-it-works',
    title: 'How Vega\'s AI Picks Work: The Technology Behind TrueOddsIQ',
    date: '2026-04-21',
    sport: 'General',
    summary: 'TrueOddsIQ\'s AI analyst Vega uses real-time data to generate sports betting analysis. Here\'s exactly what data goes in and how the picks are generated.',
    content: `
## Who Is Vega?

Vega is TrueOddsIQ's AI sports betting analyst, powered by Claude (Anthropic). Unlike generic AI chatbots, Vega is specifically prompted to think like a sharp bettor — analyzing value, line movement, and market inefficiencies rather than just predicting winners.

## What Data Does Vega Analyze?

For every game, Vega receives:

**Odds Data**
- Live moneyline, spread, and total from 6 major sportsbooks
- Line movement (how odds have shifted)
- Best available price for each bet type

**MLB-Specific Data**
- Starting pitcher: name, ERA, WHIP, K/9, opponent batting average
- Ballpark run factor (pitcher vs hitter friendly)
- Weather conditions: temperature, wind speed and direction

**Sport-Specific Context**
- NBA: pace of play, rest/travel, back-to-backs, home/away splits
- NHL: goalie matchup, power play %, back-to-back situations
- NFL: injury reports, weather, home field advantage, divisional familiarity

## How Vega Generates Picks

Vega is instructed to:
1. Identify where the line has value based on true probability vs implied odds
2. Flag sharp money signals (line movement against public betting)
3. Consider situational factors (travel, rest, weather)
4. Only recommend bets with genuine edge — never forced picks

## Why Two AI Models?

TrueOddsIQ offers analysis from both **Vega (Claude)** and **ChatGPT**. Different AI architectures sometimes catch different angles on the same game. Getting two independent perspectives helps bettors make more informed decisions.

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
  // Simple markdown renderer
  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
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
  const navigate = useNavigate()

  // Check URL for slug
  useEffect(() => {
    const slug = window.location.pathname.split('/blog/')[1]
    if (slug) {
      const post = BLOG_POSTS.find(p => p.slug === slug)
      if (post) setSelectedPost(post)
    }
  }, [])

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
      <div className="grid gap-4">
        {BLOG_POSTS.map(post => (
          <BlogCard
            key={post.slug}
            post={post}
            onClick={() => setSelectedPost(post)}
          />
        ))}
      </div>
    </div>
  )
}
