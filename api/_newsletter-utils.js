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

const SITE_ORIGIN = process.env.SITE_URL || 'https://www.trueoddsiq.com'

function formatPickLinesHtml(picksText) {
  return String(picksText || '').split('\n').map(line => {
    if (line.includes('@') && line.includes('→')) {
      const [matchup, pick] = line.split('→')
      return `<div style="background:#f1f5f9;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin:12px 0;">
        <p style="margin:0 0 4px;font-size:14px;color:#0f172a;font-weight:600;">${matchup.trim()}</p>
        <p style="margin:0;font-size:15px;color:#f59e0b;font-weight:700;">${pick.trim()}</p>
      </div>`
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      const t = line.slice(2, -2)
      return `<p style="font-weight:900;font-size:16px;color:#f59e0b;margin:20px 0 6px;">${t}</p>`
    }
    if (line.startsWith('- ')) {
      const content = line.slice(2)
      const highlighted = content.replace(/([+-]\d+)/g, '<span style="color:#f59e0b;font-weight:700;">$1</span>')
      const isEdge = /^edge:/i.test(content)
      return `<p style="margin:${isEdge ? '8px' : '3px'} 0;padding-left:14px;color:#334155;font-size:${isEdge ? '15px' : '14px'};line-height:1.6;">• ${highlighted}</p>`
    }
    if (!line.trim()) return '<div style="height:8px"></div>'
    const isHeader = /^(TOP PICK|PICK\s*#?\d+)/i.test(line.trim())
    if (isHeader) {
      return `<p style="margin:0 0 12px;font-weight:800;font-size:13px;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">${line.trim()}</p>`
    }
    return `<p style="margin:3px 0;color:#475569;font-size:14px;line-height:1.5;">${line}</p>`
  }).join('')
}

export function buildNewsletterEmailHtml(topPickText, date, unsubscribeHref = `${SITE_ORIGIN}/unsubscribe`) {
  const lines = formatPickLinesHtml(topPickText)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">TrueOdds<span style="color:#f59e0b;">IQ</span></h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Today's Top Pick | ${date}</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <div style="background:#121212;border-left:3px solid #f5b800;padding:12px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;color:#fafafa;line-height:1.6;">
      <strong>Odds as of ${date}:</strong> Shop multiple books for the best line. AI-generated for informational purposes only. Always bet responsibly. Must be 21+.
    </div>
    ${lines}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-top:20px;font-size:13px;color:#475569;line-height:1.55;">
      <strong style="color:#0f172a;">Want all 3 daily picks?</strong> Premium unlocks the full AI Picks slate with write-ups for every pick on the card.
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${SITE_ORIGIN}/premium" style="background:#f59e0b;color:#0f172a;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;">Unlock Premium Picks</a>
    </div>
    <div style="text-align:center;margin-top:12px;">
      <a href="${SITE_ORIGIN}/odds" style="color:#64748b;font-size:13px;font-weight:600;text-decoration:none;">Compare live odds →</a>
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:14px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">TrueOddsIQ | trueoddsiq.com | Must be 21+ | Gambling problem? <a href="tel:18004264537" style="color:#16a34a;">1-800-GAMBLER</a></p>
    <p style="margin:4px 0 0;"><a href="${unsubscribeHref}" style="color:#94a3b8;font-size:11px;">Unsubscribe</a></p>
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
