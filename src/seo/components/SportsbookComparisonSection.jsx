import { SPORTSBOOK_LABELS, SPORTSBOOKS } from '../../lib/oddsApi'

const BOOK_NOTES = {
  draftkings: 'Widely available US app; strong MLB and NBA menus.',
  fanduel: 'Popular interface; frequent same-game parlay options.',
  betmgm: 'MGM rewards integration in many states.',
  williamhill_us: 'Caesars Sportsbook branding in the US market.',
  pinnacle: 'Known for sharp lines; not available in all US states.',
  bet365: 'Global book; US availability varies by state.',
}

export default function SportsbookComparisonSection() {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>
        Sportsbooks we compare
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        TrueOddsIQ pulls odds from six major books when our data provider lists them. We highlight the best displayed
        price on each side — we do not control lines and we are not affiliated with these operators today.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SPORTSBOOKS.map(key => (
          <div
            key={key}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              {SPORTSBOOK_LABELS[key] || key}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {BOOK_NOTES[key] || 'US-regulated sportsbook when available in your state.'}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        Must be 21+ and physically located where sports betting is legal. Availability varies by jurisdiction.
      </p>
    </section>
  )
}
