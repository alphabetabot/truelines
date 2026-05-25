import crypto from 'crypto'

const SITE_URL = process.env.SITE_URL || 'https://trueoddsiq.com'

export function unsubscribeToken(email) {
  const secret = process.env.NEWSLETTER_SECRET || process.env.CRON_SECRET || ''
  if (!secret) return ''

  return crypto
    .createHmac('sha256', secret)
    .update(String(email).trim().toLowerCase())
    .digest('hex')
}

export function verifyUnsubscribeToken(email, token) {
  const expected = unsubscribeToken(email)
  const actual = String(token)
  return Boolean(
    expected &&
    actual &&
    expected.length === actual.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  )
}

export function unsubscribeUrl(email) {
  const address = String(email).trim().toLowerCase()
  const token = unsubscribeToken(address)
  const params = new URLSearchParams({ email: address, token })
  return `${SITE_URL}/unsubscribe?${params.toString()}`
}

export async function sendNewsletterEmail({ resend, to, subject, html, text }) {
  const unsubscribe = unsubscribeUrl(to)
  const { data, error } = await resend.emails.send({
    from: 'TrueOddsIQ Picks <picks@trueoddsiq.com>',
    to,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubscribe}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  if (error) {
    throw new Error(error.message || 'Resend failed to send newsletter email')
  }

  return data
}
