export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-black mb-2" style={{ color: '#0f172a' }}>Terms of Service</h1>
      <p className="text-xs mb-6" style={{ color: '#94a3b8' }}>Last updated: May 2026</p>

      <div className="space-y-5 text-sm leading-relaxed" style={{ color: '#475569' }}>
        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Informational Use Only</h2>
          <p>
            TrueOddsIQ provides sports odds comparison, AI-generated analysis, and pick tracking for
            informational and entertainment purposes only. Nothing on this site is financial, legal, or
            gambling advice.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>No Guaranteed Results</h2>
          <p>
            AI-generated picks can be wrong. Past performance does not guarantee future results. You are
            solely responsible for any decisions or wagers you make.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Age and Jurisdiction</h2>
          <p>
            You must be at least 21 years old and located in a jurisdiction where sports betting is legal to
            use any betting-related information on this site.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Account Use</h2>
          <p>
            You are responsible for maintaining the security of your account and for complying with all
            applicable laws. We may restrict access if the service is abused.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2" style={{ color: '#0f172a' }}>Contact</h2>
          <p>
            Questions about these terms can be sent to <a href="mailto:info@trueoddsiq.com" style={{ color: '#2563eb' }}>info@trueoddsiq.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
