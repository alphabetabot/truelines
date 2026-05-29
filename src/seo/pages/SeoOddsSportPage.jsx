import { useParams } from 'react-router-dom'
import NotFound from '../../pages/NotFound'
import { getSeoSport, isValidSeoSportSlug, getOddsSportFaqs, getInternalLinks, SEO_ROUTE_META } from '../seoContent'
import SeoPageLayout from '../components/SeoPageLayout'
import SEOHero from '../components/SEOHero'
import SportsOddsPreview from '../components/SportsOddsPreview'
import SportsbookComparisonSection from '../components/SportsbookComparisonSection'
import SEOFAQSection from '../components/SEOFAQSection'
import InternalLinksSection from '../components/InternalLinksSection'

export default function SeoOddsSportPage() {
  const { sportSlug } = useParams()
  if (!isValidSeoSportSlug(sportSlug)) {
    return <NotFound />
  }

  const sport = getSeoSport(sportSlug)
  const path = `/odds/${sportSlug}`
  const meta = SEO_ROUTE_META[path]

  return (
    <SeoPageLayout meta={{ ...meta, path }}>
      <SEOHero
        title={`${sport.label} odds comparison`}
        subtitle={`Compare live ${sport.label} moneyline, spread, and total odds from DraftKings, FanDuel, BetMGM, Caesars, Pinnacle, and Bet365. Shop lines before you bet — informational use only.`}
        primaryCta={{ to: '/odds', label: `Open live ${sport.label} odds` }}
        secondaryCta={{ to: '/compare', label: 'Line compare tool' }}
      />
      <SportsOddsPreview sportKey={sport.sportKey} sportLabel={sport.label} liveOddsPath="/odds" />
      <SportsbookComparisonSection />
      <SEOFAQSection faqs={getOddsSportFaqs(sport)} jsonLd />
      <InternalLinksSection links={getInternalLinks({ pageType: 'odds-sport', sportSlug })} />
    </SeoPageLayout>
  )
}
