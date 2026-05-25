import express from 'express'
import cors from 'cors'

// Load .env manually (dotenv ESM)
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json({ limit: '1mb' }))

// ─── Claude proxy ────────────────────────────────────────────────────────────
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' })
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

app.listen(PORT, () => {
  console.log(`TrueLines API server running on http://localhost:${PORT}`)
})
