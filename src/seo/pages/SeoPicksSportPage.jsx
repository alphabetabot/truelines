import { useParams } from 'react-router-dom'
import NotFound from '../../pages/NotFound'
import {
  getSeoSport,
  isValidSeoSportSlug,
  getPicksSportFaqs,
  getInternalLinks,
  SEO_ROUTE_META,
} from '../seoContent'
import SeoPageLayout from '../components/SeoPageLayout'
import SEOHero from '../components/SEOHero'
import AIPicksExplainer from '../components/AIPicksExplainer'
import SportsOddsPreview from '../components/SportsOddsPreview'
import SEOFAQSection from '../components/SEOFAQSection'
import InternalLinksSection from '../components/InternalLinksSection'

export default function SeoPicksSportPage() {
  const { sportSlug } = useParams()
  if (!isValidSeoSportSlug(sportSlug)) {
    return <NotFound />
  }

  const sport = getSeoSport(sportSlug)
  const path = `/picks/${sportSlug}`
  const meta = SEO_ROUTE_META[path]

  return (
    <SeoPageLayout meta={{ ...meta, path }}>
      <SEOHero
        title={`${sport.label} AI picks & analysis`}
        subtitle={`See how TrueOddsIQ surfaces ${sport.label} bets with odds context and public grading. Free top pick preview daily; full slate with Premium.`}
        primaryCta={{ to: '/premium', label: 'Upgrade to Premium' }}
        secondaryCta={{ to: '/login', label: 'Create free account' }}
      />
      <AIPicksExplainer sportLabel={sport.label} pickSport={sport.pickSport} />
      <SportsOddsPreview sportKey={sport.sportKey} sportLabel={sport.label} liveOddsPath="/odds" />
      <SEOFAQSection faqs={getPicksSportFaqs(sport)} jsonLd />
      <InternalLinksSection links={getInternalLinks({ pageType: 'picks-sport', sportSlug })} />
    </SeoPageLayout>
  )
}
