import { useEffect } from 'react'

export default function SEOFAQSection({ title = 'Frequently asked questions', faqs = [], jsonLd = false }) {
  useEffect(() => {
    if (!jsonLd || !faqs.length) return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'seo-faq-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    })
    document.head.appendChild(script)
    return () => {
      document.getElementById('seo-faq-jsonld')?.remove()
    }
  }, [jsonLd, faqs])

  if (!faqs.length) return null

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black mb-4" style={{ color: '#0f172a' }}>{title}</h2>
      <div className="space-y-3">
        {faqs.map(({ question, answer }) => (
          <details
            key={question}
            className="rounded-xl px-4 py-3 group"
            style={{ background: '#fff', border: '1px solid #e2e8f0' }}
          >
            <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between gap-2" style={{ color: '#0f172a' }}>
              {question}
              <span className="text-[#94a3b8] group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#64748b' }}>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
