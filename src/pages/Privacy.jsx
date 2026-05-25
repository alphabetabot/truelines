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
            newsletter preferences, responsible-gambling acknowledgments, and basic usage analytics.
            We also process sports odds, scores, and AI analysis requests needed to provide the service.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>How We Use Information</h2>
          <p>
            We use information to operate the website, send requested newsletters, protect accounts, monitor
            performance, troubleshoot errors, prevent abuse, and improve product features. We do not sell your
            personal information.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Email Communications</h2>
          <p>
            If you opt in to the newsletter, we may send daily picks and product updates. Every marketing
            email includes an unsubscribe link, including one-click unsubscribe headers where supported, and
            you can opt out at any time. We may retain a record of your unsubscribe status so we can honor
            that preference.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Analytics and Cookies</h2>
          <p>
            TrueOddsIQ uses Google Analytics 4 (measurement ID G-W6K2P39FPD) to understand aggregate site
            usage, such as pages viewed, device/browser information, approximate geography, referral source,
            and interactions with site features. Google Analytics may set cookies or use similar identifiers
            to measure repeat visits and site performance.
          </p>
          <p className="mt-2">
            You can limit analytics collection by using browser privacy controls, blocking cookies, or using
            Google's browser add-on at <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>tools.google.com/dlpage/gaoptout</a>.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Service Providers</h2>
          <p>
            We use third-party providers to run the service, including authentication/database providers,
            email delivery providers, analytics providers, AI providers, odds/scores data providers, hosting
            providers, and security/monitoring tools. These providers process data only as needed to provide
            their services to TrueOddsIQ.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Data Retention and Account Requests</h2>
          <p>
            We retain account, newsletter, analytics, and operational records for as long as needed to provide
            the service, comply with legal obligations, resolve disputes, prevent abuse, and maintain business
            records. You may request account deletion or ask privacy questions by contacting us at the email
            address below. Some records, such as unsubscribe status or security logs, may be retained when
            necessary for compliance or abuse prevention.
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
