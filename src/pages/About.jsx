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
          is a waste of time — and that time costs money. We built one tool that does it all: real-time odds 
          comparison, AI-powered analysis, and a daily picks newsletter. Free. No bloat. No BS.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-6">
        <h2 className="mb-4" style={{ color: '#0f172a', fontSize: '1.1rem' }}>How It Works</h2>
        <div className="grid gap-4">
          {[
            {
              icon: BarChart2,
              title: 'Live Odds from 6 Books',
              desc: 'We pull real-time lines from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365 every 60 seconds via The Odds API. Best available odds are highlighted in green.'
            },
            {
              icon: Brain,
              title: 'AI Analysis Powered by Claude & ChatGPT',
              desc: 'Select any game and get instant analysis from two independent AI systems. Each considers line movement, pitcher matchups (MLB), weather, venue factors, injuries, and sharp money signals.'
            },
            {
              icon: TrendingUp,
              title: 'Daily Picks Newsletter',
              desc: 'Every morning our AI scans the full slate across MLB, NBA, and NHL and surfaces only the bets with genuine edge — no forced picks, no filler. Free with signup.'
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
            'Live odds from all 6 sportsbooks',
            'Starting pitcher data: ERA, WHIP, K/9, opponent batting average (MLB)',
            'Ballpark factors: run factor, dimensions, altitude',
            'Weather conditions: temperature, wind speed and direction',
            'Sport-specific context: pace, injuries, rest, home/away splits',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#64748b' }}>
              <span style={{ color: '#2563eb', marginTop: 2 }}>•</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          The AI is instructed to think like a sharp bettor — identifying line value, market inefficiencies, and situational edges rather than just picking winners. We use two models intentionally: different architectures sometimes catch different angles.
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
