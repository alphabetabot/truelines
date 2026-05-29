import { SEO_ROUTE_META, AI_PICKS_FAQS, getInternalLinks } from '../seoContent'
import SeoPageLayout from '../components/SeoPageLayout'
import SEOHero from '../components/SEOHero'
import AIPicksExplainer from '../components/AIPicksExplainer'
import SportsbookComparisonSection from '../components/SportsbookComparisonSection'
import SEOFAQSection from '../components/SEOFAQSection'
import InternalLinksSection from '../components/InternalLinksSection'

const path = '/ai-sports-picks'

export default function SeoAiSportsPicksPage() {
  const meta = SEO_ROUTE_META[path]

  return (
    <SeoPageLayout meta={{ ...meta, path }}>
      <SEOHero
        title="AI sports picks"
        subtitle="Daily AI-assisted picks for MLB, NBA, and NHL when games are on the slate. Transparent tracking, free preview, and optional email delivery — not financial advice."
        primaryCta={{ to: '/picks', label: 'See today\'s picks' }}
        secondaryCta={{ to: '/', label: 'Home' }}
      />
      <AIPicksExplainer />
      <SportsbookComparisonSection />
      <SEOFAQSection faqs={AI_PICKS_FAQS} jsonLd />
      <InternalLinksSection links={getInternalLinks({ pageType: 'ai-picks' })} />
    </SeoPageLayout>
  )
}
