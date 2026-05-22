const FROM = 'TrueOddsIQ Picks <picks@trueoddsiq.com>'
const BATCH_SIZE = 100

/**
 * Send newsletter HTML to subscribers.
 * one email per subscriber — never multi-recipient To
 */
export async function sendNewsletterToSubscribers(resend, emails, { subject, html }) {
  let sent = 0

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE)
    const payload = chunk.map((email) => ({
      from: FROM,
      to: email,
      subject,
      html,
    }))
    await resend.batch.send(payload)
    sent += chunk.length
  }

  return sent
}
