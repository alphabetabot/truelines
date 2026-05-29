import { SEO_ROUTE_META, SPORTSBOOK_FAQS, getInternalLinks } from '../seoContent'
import SeoPageLayout from '../components/SeoPageLayout'
import SEOHero from '../components/SEOHero'
import SportsbookComparisonSection from '../components/SportsbookComparisonSection'
import SportsOddsPreview from '../components/SportsOddsPreview'
import SEOFAQSection from '../components/SEOFAQSection'
import InternalLinksSection from '../components/InternalLinksSection'

const path = '/sportsbook-comparison'

export default function SeoSportsbookComparisonPage() {
  const meta = SEO_ROUTE_META[path]

  return (
    <SeoPageLayout meta={{ ...meta, path }}>
      <SEOHero
        title="Sportsbook odds comparison"
        subtitle="Line shopping across six major sportsbooks helps you find the best price on spreads, totals, and moneylines. TrueOddsIQ displays live data when available — we are not a sportsbook."
        primaryCta={{ to: '/odds', label: 'Compare live odds' }}
        secondaryCta={{ to: '/compare', label: 'Open line compare' }}
      />
      <SportsbookComparisonSection />
      <h2 className="text-xl font-black mb-3" style={{ color: '#0f172a' }}>
        Live odds preview (NBA sample)
      </h2>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>
        Example feed below uses NBA when scheduled games are available. Switch sports in the live tool.
      </p>
      <SportsOddsPreview sportKey="basketball_nba" sportLabel="NBA" liveOddsPath="/odds" />
      <SEOFAQSection faqs={SPORTSBOOK_FAQS} jsonLd />
      <InternalLinksSection links={getInternalLinks({ pageType: 'sportsbook' })} />
    </SeoPageLayout>
  )
}
