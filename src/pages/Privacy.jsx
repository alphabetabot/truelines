export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>Privacy Policy</h1>
      <p className="text-xs mb-6" style={{ color: '#94a3b8' }}>Last updated: May 2026</p>

      <div className="space-y-5 text-sm leading-relaxed" style={{ color: '#475569' }}>
        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Information We Collect</h2>
          <p>
            TrueOddsIQ may collect account information such as your email address, authentication details,
            newsletter preferences, and basic usage analytics. We also process sports odds, scores, and AI
            analysis requests needed to provide the service.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>How We Use Information</h2>
          <p>
            We use information to operate the website, send requested newsletters, protect accounts, monitor
            performance, and improve product features. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Email Communications</h2>
          <p>
            If you opt in to the newsletter, we may send daily picks and product updates. Every marketing
            email includes an unsubscribe link, and you can opt out at any time.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Analytics and Third Parties</h2>
          <p>
            We may use analytics providers, email providers, authentication providers, and AI/odds data
            providers to run the service. These providers process data only as needed for their services.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Contact</h2>
          <p>
            Questions about privacy can be sent to <a href="mailto:info@trueoddsiq.com" style={{ color: '#2563eb' }}>info@trueoddsiq.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
