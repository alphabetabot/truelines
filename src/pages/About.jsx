import { Brain, BarChart2, Shield, TrendingUp } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="mb-2" style={{ color: '#0f172a' }}>About TrueOddsIQ</h1>
      <p className="mb-8 text-sm" style={{ color: '#64748b' }}>Built by bettors, for bettors.</p>

      <div className="p-5 rounded-2xl mb-6" style={{ background: '#0f172a' }}>
        <h2 className="text-white mb-3" style={{ fontSize: '1.1rem' }}>Our Mission</h2>
        <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
          TrueOddsIQ was built out of frustration. Jumping between multiple sportsbook tabs to find the best line
          wastes time — and that time costs money. We built one tool for real-time odds comparison, AI-assisted
          research, and a daily picks newsletter. Free to browse odds; free account unlocks the full pick slate.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="mb-4" style={{ color: '#0f172a', fontSize: '1.1rem' }}>How It Works</h2>
        <div className="grid gap-4">
          {[
            {
              icon: BarChart2,
              title: 'Live Odds from 6 Books',
              desc: 'We pull lines from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365 on a regular refresh via The Odds API. Best available odds are highlighted in green.',
            },
            {
              icon: Brain,
              title: 'AI Analysis (Claude & ChatGPT)',
              desc: 'Signed-in users can run game analysis from two models using the odds snapshot we provide. For MLB, we also include probable pitcher stats when available. Analysis is informational — not a substitute for your own research.',
            },
            {
              icon: TrendingUp,
              title: 'Daily Picks Newsletter',
              desc: 'Each morning our pipeline surfaces a short list of bets from the stored slate (MLB, NBA, NHL). The homepage shows a public preview of the top pick; all picks require a free account.',
            },
            {
              icon: Shield,
              title: 'Transparent & Independent',
              desc: 'We are not a sportsbook. We take no bets. Sportsbook VISIT links go to each book\'s website for line shopping — we are not on an affiliate program today. Our goal is a clear view of the market.',
            },
          ].map(({ icon, title, desc }) => {
            const FeatureIcon = icon
            return (
            <div key={title} className="flex gap-4 p-4 rounded-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                <FeatureIcon size={18} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            </div>
          )})}
        </div>
      </div>

      <div className="p-5 rounded-2xl mb-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <h2 className="mb-3" style={{ color: '#0f172a', fontSize: '1.1rem' }}>What We Actually Feed the AI</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>
          We are transparent about inputs. Today the models receive:
        </p>
        <ul className="space-y-2 mb-3">
          {[
            'Current odds from major US sportsbooks (moneyline, spread, total where available)',
            'MLB probable pitcher records (ERA, WHIP, W-L) when the schedule API lists them',
            'Sport-specific prompts for NBA, NHL, NFL, etc. (general situational factors — not proprietary injury or sharp-money feeds)',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#64748b' }}>
              <span style={{ color: '#2563eb', marginTop: 2 }}>•</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          We do <strong>not</strong> currently ingest private injury reports, verified sharp-money signals, or historical line-movement databases.
          Any mention of those factors in AI output is model inference from public odds — treat it accordingly.
        </p>
      </div>

      <div className="p-5 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <h2 className="mb-2" style={{ color: '#92400e', fontSize: '1rem' }}>⚠️ Important</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#92400e' }}>
          TrueOddsIQ is an informational tool only. All picks, analysis, and odds data are for entertainment and research.
          We are not licensed gambling advisors. Past performance does not guarantee future results. Always bet responsibly. Must be 21+.
          Gambling problem? Call <strong>1-800-GAMBLER</strong>.
        </p>
      </div>
    </div>
  )
}
