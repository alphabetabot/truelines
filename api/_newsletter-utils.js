import crypto from 'crypto'
import { BRAND, EMAIL_FONT } from './_brand-tokens.js'

const SITE_ORIGIN = (process.env.SITE_URL || 'https://www.trueoddsiq.com').replace(/\/$/, '')

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
  return `${SITE_ORIGIN}/unsubscribe?${params.toString()}`
}

function formatPickLinesHtml(picksText) {
  return String(picksText || '').split('\n').map(line => {
    if (line.includes('@') && line.includes('→')) {
      const [matchup, pick] = line.split('→')
      return `<div style="background:${BRAND.bgElevated};border:1px solid ${BRAND.border};border-left:3px solid ${BRAND.gold};padding:14px 16px;border-radius:12px;margin:14px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:${BRAND.textMuted};font-weight:600;">${matchup.trim()}</p>
        <p style="margin:0;font-size:16px;color:${BRAND.gold};font-weight:800;">${pick.trim()}</p>
      </div>`
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      const t = line.slice(2, -2)
      return `<p style="font-weight:900;font-size:17px;color:${BRAND.gold};margin:22px 0 8px;line-height:1.35;">${t}</p>`
    }
    if (line.startsWith('- ')) {
      const content = line.slice(2)
      const highlighted = content.replace(
        /([+-]\d+)/g,
        `<span style="color:${BRAND.gold};font-weight:700;">$1</span>`,
      )
      const isEdge = /^edge:/i.test(content)
      return `<p style="margin:${isEdge ? '10px' : '4px'} 0;padding-left:14px;color:${BRAND.textMuted};font-size:${isEdge ? '15px' : '14px'};line-height:1.65;">• ${highlighted}</p>`
    }
    if (!line.trim()) return '<div style="height:10px"></div>'
    const isHeader = /^(TOP PICK|PICK\s*#?\d+)/i.test(line.trim())
    if (isHeader) {
      return `<p style="margin:0 0 14px;font-weight:800;font-size:12px;color:${BRAND.green};letter-spacing:0.1em;text-transform:uppercase;">${line.trim()}</p>`
    }
    return `<p style="margin:4px 0;color:${BRAND.textMuted};font-size:14px;line-height:1.55;">${line}</p>`
  }).join('')
}

export function buildNewsletterEmailHtml(topPickText, date, unsubscribeHref = `${SITE_ORIGIN}/unsubscribe`) {
  const lines = formatPickLinesHtml(topPickText)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:${EMAIL_FONT};color:${BRAND.text};">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:${BRAND.bgCard};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.45);">
    <div style="background:${BRAND.bgSecondary};padding:28px 24px;text-align:center;border-bottom:1px solid ${BRAND.greenBorder};">
      <h1 style="margin:0;color:${BRAND.text};font-size:28px;font-weight:900;letter-spacing:-0.02em;">TrueOdds<span style="color:${BRAND.green};">IQ</span></h1>
      <p style="margin:8px 0 0;color:${BRAND.textMuted};font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Today&apos;s Top Pick · ${date}</p>
    </div>
    <div style="background:${BRAND.bgCard};padding:24px;">
      <div style="background:${BRAND.bgSecondary};border-left:3px solid ${BRAND.gold};padding:14px 16px;border-radius:10px;margin-bottom:20px;font-size:12px;color:${BRAND.text};line-height:1.65;">
        <strong style="color:${BRAND.gold};">Odds as of ${date}:</strong> Shop multiple books for the best line. AI-generated for informational purposes only. Always bet responsibly. Must be 21+.
      </div>
      ${lines}
      <div style="background:${BRAND.bgElevated};border:1px solid ${BRAND.border};border-radius:12px;padding:16px 18px;margin-top:24px;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
        <strong style="color:${BRAND.text};">Want all 3 daily picks?</strong> Premium unlocks the full AI Picks slate with write-ups for every pick on the card.
      </div>
      <div style="text-align:center;margin-top:22px;">
        <a href="${SITE_ORIGIN}/premium" style="background:linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%);color:${BRAND.ctaText};padding:14px 32px;border-radius:12px;font-weight:800;font-size:14px;text-decoration:none;display:inline-block;box-shadow:0 4px 18px rgba(245,184,0,0.25);">Unlock Premium Picks</a>
      </div>
      <div style="text-align:center;margin-top:14px;">
        <a href="${SITE_ORIGIN}/odds" style="color:${BRAND.green};font-size:13px;font-weight:700;text-decoration:none;">Compare live odds →</a>
      </div>
    </div>
    <div style="background:${BRAND.bgSecondary};padding:16px 20px;text-align:center;border-top:1px solid ${BRAND.border};">
      <p style="margin:0;color:${BRAND.textDim};font-size:11px;line-height:1.6;">TrueOddsIQ · trueoddsiq.com · Must be 21+ · Gambling problem? <a href="tel:18004264537" style="color:${BRAND.green};font-weight:700;text-decoration:none;">1-800-GAMBLER</a></p>
      <p style="margin:6px 0 0;"><a href="${unsubscribeHref}" style="color:${BRAND.textDim};font-size:11px;text-decoration:underline;">Unsubscribe</a></p>
    </div>
  </div>
</div></body></html>`
}

export function buildNewsletterEmailPlainText(topPickText, date, unsubscribeHref = `${SITE_ORIGIN}/unsubscribe`) {
  return [
    `TrueOddsIQ — Today's Top Pick`,
    date,
    '',
    topPickText.trim(),
    '',
    'Premium unlocks all 3 daily picks with full write-ups: ' + `${SITE_ORIGIN}/premium`,
    'Live odds: ' + `${SITE_ORIGIN}/odds`,
    '',
    `Unsubscribe: ${unsubscribeHref}`,
  ].join('\n')
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
