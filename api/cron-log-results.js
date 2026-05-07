// Cron job to auto-log pick results daily
// Runs once per day (best time: early evening to capture game results)

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Call the log-results endpoint
    const logRes = await fetch(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/log-results` : 'http://localhost:3000/api/log-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const data = await logRes.json()
    return res.json({ success: true, ...data })
  } catch (err) {
    console.error('Cron log-results failed:', err)
    return res.status(500).json({ error: err.message })
  }
}
