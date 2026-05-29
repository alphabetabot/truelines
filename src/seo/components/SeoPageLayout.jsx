import PageMeta from '../../components/PageMeta'
import ResponsibleGamblingDisclaimer from './ResponsibleGamblingDisclaimer'

/** Wrapper for SEO landings — sets meta + standard page shell. */
export default function SeoPageLayout({ meta, children }) {
  return (
    <div className="max-w-3xl mx-auto py-2">
      <PageMeta title={meta.title} description={meta.description} path={meta.path} />
      {children}
      <ResponsibleGamblingDisclaimer className="mt-8" />
    </div>
  )
}
