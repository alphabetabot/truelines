import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { sendNewsletterEmail, unsubscribeUrl, verifyUnsubscribeToken } from './newsletter-utils.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Called by a cron job or manually to send daily picks newsletter
export default async function handler(req, res) {
  if (req.query?.action === 'unsubscribe') {
    return handleUnsubscribe(req, res)
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Simple auth check
  const secret = req.headers['x-newsletter-secret']
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { subject, htmlContent, picks } = req.body

  try {
    // Get all newsletter subscribers from Supabase
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('active', true)

    if (error) throw error

    if (!subscribers || subscribers.length === 0) {
      return res.json({ sent: 0, message: 'No subscribers' })
    }

    const emails = subscribers.map(s => s.email)
    let sent = 0
    const failures = []

    for (const email of emails) {
      try {
        const unsubscribe = unsubscribeUrl(email)
        await sendNewsletterEmail({
          resend,
          to: email,
          subject: subject || `TrueOddsIQ Daily Picks - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
          html: htmlContent ? appendUnsubscribeFooter(htmlContent, unsubscribe) : generateNewsletterHTML(picks, unsubscribe),
          text: `TrueOddsIQ Daily Picks\n\nView full analysis: https://trueoddsiq.com/picks\nUnsubscribe: ${unsubscribe}`,
        })
        sent++
      } catch (sendErr) {
        console.error(`Newsletter send failed for ${email}:`, sendErr.message)
        failures.push({ email, error: sendErr.message })
      }
    }

    if (failures.length) {
      return res.status(502).json({
        error: 'One or more newsletter emails failed to send',
        sent,
        failed: failures.length,
        failures: failures.slice(0, 10),
      })
    }

    return res.json({ sent, message: `Newsletter sent to ${sent} subscribers` })
  } catch (err) {
    console.error('Newsletter error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function handleUnsubscribe(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.query?.email || req.body?.email || '').trim().toLowerCase()
  const token = String(req.query?.token || req.body?.token || '')

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return res.status(400).json({ ok: false, error: 'Invalid unsubscribe link' })
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ active: false })
    .eq('email', email)

  if (error) {
    console.error('Unsubscribe failed:', error.message)
    return res.status(500).json({ ok: false, error: 'Failed to unsubscribe' })
  }

  return res.json({ ok: true, message: 'You have been unsubscribed.' })
}

function appendUnsubscribeFooter(html, unsubscribeHref) {
  const footer = `<p style="margin:16px 0 0;color:#94a3b8;font-size:11px;text-align:center;"><a href="${unsubscribeHref}" style="color:#2563eb;">Unsubscribe</a></p>`
  if (String(html).includes('</body>')) {
    return String(html).replace('</body>', `${footer}</body>`)
  }
  return `${html}${footer}`
}

function generateNewsletterHTML(picks, unsubscribeHref = 'https://trueoddsiq.com/unsubscribe') {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrueOddsIQ Daily Picks</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">
        TrueOdds<span style="color:#f59e0b;">IQ</span>
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;">Daily AI Picks · ${date}</p>
    </div>

    <!-- Main content -->
    <div style="background:#ffffff;padding:24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      
      <!-- AI Pick of the Day -->
      <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;color:#f59e0b;font-size:11px;font-weight:800;letter-spacing:1px;">⭐ AI PICK OF THE DAY</p>
        <h2 style="margin:0 0 12px;color:#ffffff;font-size:20px;font-weight:900;">${picks?.topPick?.game || 'Check the site for today\'s top pick'}</h2>
        <p style="margin:0 0 12px;color:#f59e0b;font-size:16px;font-weight:700;">${picks?.topPick?.pick || ''}</p>
        ${picks?.topPick?.reasons ? `
        <ul style="margin:0;padding-left:20px;color:rgba(255,255,255,0.8);font-size:14px;line-height:1.8;">
          ${picks.topPick.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>` : ''}
      </div>

      <!-- Optional plays -->
      ${picks?.optionalPlays?.length ? `
      <p style="margin:0 0 12px;color:#0f172a;font-size:13px;font-weight:800;letter-spacing:0.5px;">📊 OPTIONAL PLAYS</p>
      ${picks.optionalPlays.map(play => `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;">
        <p style="margin:0 0 4px;color:#0f172a;font-size:15px;font-weight:700;">${play.game}</p>
        <p style="margin:0 0 8px;color:#16a34a;font-size:14px;font-weight:600;">${play.pick}</p>
        <p style="margin:0;color:#64748b;font-size:13px;">${play.reason}</p>
      </div>`).join('')}` : ''}

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="https://trueoddsiq.com" 
          style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">
          View Full Analysis →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:16px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;">
        TrueOddsIQ · trueoddsiq.com · For informational purposes only
      </p>
      <p style="margin:0;color:#94a3b8;font-size:11px;">
        Gambling problem? Call 1-800-GAMBLER · Must be 21+ to wager
      </p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">
        <a href="${unsubscribeHref}" style="color:#2563eb;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
