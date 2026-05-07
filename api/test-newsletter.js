// Test newsletter endpoint - sends to user only for verification before public send
import { Resend } from 'resend'
import { getSupabase } from './supabase-client.js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Import the main cron handler to reuse its logic
import handler from './cron-newsletter.js'

export default async function testHandler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get today's picks by calling the main cron logic
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => data })
    }
    
    const result = await handler(req, mockRes)
    
    // Extract picks from the response
    const picks = result.picks || 'No picks generated'
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    
    // Send test email to user only
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>TEST: Today's Picks - ${date}</h2>
  <p><strong>This is a test email. Check the picks below before we send to subscribers.</strong></p>
  <hr>
  <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
${picks}
  </pre>
  <hr>
  <p>If this looks good, the cron will send to all subscribers tomorrow at 7:05 AM.</p>
  <p>If there are issues, let me know before then.</p>
</body>
</html>
    `
    
    await resend.emails.send({
      from: 'TrueOddsIQ Test <picks@trueoddsiq.com>',
      to: 'angry.asian.betting@gmail.com',
      subject: `[TEST] TrueOddsIQ Picks — ${date}`,
      html,
    })
    
    return res.json({ sent: 1, message: 'Test email sent to user', picks })
  } catch (err) {
    console.error('Test newsletter error:', err)
    return res.status(500).json({ error: err.message })
  }
}
