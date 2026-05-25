import { Brain, BarChart2, Shield, TrendingUp } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="mb-2" style={{ color: '#0f172a' }}>About TrueOddsIQ</h1>
      <p className="mb-8 text-sm" style={{ color: '#64748b' }}>Built by bettors, for bettors.</p>

      {/* Mission */}
      <div className="p-5 rounded-2xl mb-6" style={{ background: '#0f172a' }}>
        <h2 className="text-white mb-3" style={{ fontSize: '1.1rem' }}>Our Mission</h2>
        <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
          TrueOddsIQ was built out of frustration. Jumping between 6 different sportsbook tabs to find the best line 
          is a waste of time. We built one research tool for regularly refreshed odds comparison, AI-assisted 
          matchup analysis, and a daily picks newsletter. Free. Clear. Built for responsible line shopping.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-6">
        <h2 className="mb-4" style={{ color: '#0f172a', fontSize: '1.1rem' }}>How It Works</h2>
        <div className="grid gap-4">
          {[
            {
              icon: BarChart2,
              title: 'Odds from Major Sportsbooks',
              desc: 'We request current lines from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365 through The Odds API. Availability can vary by sport, market, and book; when multiple prices are available, the best listed odds are highlighted in green.'
            },
            {
              icon: Brain,
              title: 'AI Analysis Powered by Claude & ChatGPT',
              desc: 'Select a game and get AI-assisted analysis based on the current odds snapshot and available matchup context. MLB analysis can include probable pitcher and weather/venue data when available; we do not currently ingest injury feeds, betting splits, or historical line movement.'
            },
            {
              icon: TrendingUp,
              title: 'Daily Picks Newsletter',
              desc: 'Every morning our picks workflow reviews the available slate and current lines, then publishes a short list of research picks when enough data is available. No pick is guaranteed, and some slates may have fewer opportunities.'
            },
            {
              icon: Shield,
              title: 'Transparent & Independent',
              desc: 'We are not a sportsbook. We take no bets. We have no financial relationship with any book that influences the odds we display. Our only goal is giving you the clearest picture of the market.'
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-4 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <Icon size={18} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Methodology */}
      <div className="p-5 rounded-2xl mb-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <h2 className="mb-3" style={{ color: '#0f172a', fontSize: '1.1rem' }}>AI Methodology</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>
          Our AI analysis is powered by Claude (Anthropic) and ChatGPT (OpenAI) — two of the most capable large language models available. For each game, we feed them:
        </p>
        <ul className="space-y-2 mb-3">
          {[
            'Current moneyline, spread, and total prices from available sportsbooks',
            'Starting pitcher data such as ERA, WHIP, K/9, opponent batting average, and HR/9 when available for MLB',
            'MLB venue and weather details when available from the schedule feed',
            'Basic game context such as teams, sport, start time, and home/away matchup',
            'Line-shopping differences across the books returned by The Odds API',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#64748b' }}>
              <span style={{ color: '#2563eb', marginTop: 2 }}>•</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          The AI is instructed to compare prices, summarize available context, and explain uncertainty instead of inventing missing inputs. We use two models intentionally because different systems can frame the same odds snapshot in different ways.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="p-5 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <h2 className="mb-2" style={{ color: '#92400e', fontSize: '1rem' }}>⚠️ Important</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#92400e' }}>
          TrueOddsIQ is an informational tool only. All picks, analysis, and odds data are provided for entertainment and research purposes. We are not licensed gambling advisors. Past AI pick performance does not guarantee future results. Always bet responsibly and within your means. Must be 21+. If you have a gambling problem, call <strong>1-800-GAMBLER</strong>.
        </p>
      </div>
    </div>
  )
}
