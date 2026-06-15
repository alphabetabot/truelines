#!/usr/bin/env node
/**
 * Production smoke audit for TrueOddsIQ.
 * Usage: node scripts/site-audit.js [--base https://www.trueoddsiq.com] [--log logs/site-audit.json]
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
function arg(name, fallback) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const BASE = arg('--base', process.env.SITE_URL || 'https://www.trueoddsiq.com').replace(/\/$/, '')
const logPath = arg('--log', '')

const checks = []

function record(name, ok, detail = {}) {
  checks.push({ name, ok, ...detail, at: new Date().toISOString() })
}

async function fetchCheck(name, url, { method = 'GET', expectStatus, validate } = {}) {
  try {
    const res = await fetch(url, { method, redirect: 'follow' })
    const text = await res.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text.slice(0, 500)
    }

    const statusOk = expectStatus == null || res.status === expectStatus
    let validOk = true
    let validMsg = ''
    if (validate) {
      const v = validate(body, res)
      validOk = v.ok
      validMsg = v.message || ''
    }

    record(name, statusOk && validOk, {
      url,
      status: res.status,
      message: validMsg || (statusOk ? 'ok' : `expected ${expectStatus}, got ${res.status}`),
    })
  } catch (err) {
    record(name, false, { url, error: err.message })
  }
}

async function run() {
  console.log(`Site audit: ${BASE}\n`)

  await fetchCheck('picks-status', `${BASE}/api/picks-status`, {
    validate: (body) => {
      if (!body?.ok) return { ok: false, message: 'ok field missing or false' }
      const phase = body.newsletter?.phase
      const sent = body.newsletter?.status === 'sent'
      const picks = body.today?.total ?? 0
      const stuckSending = sent && body.newsletter?.cron_schedule === 'pipeline:sending'
      if (stuckSending) {
        return { ok: false, message: 'newsletter sent but cron_schedule still pipeline:sending' }
      }
      return {
        ok: true,
        message: `today picks=${picks}, newsletter phase=${phase || 'n/a'}`,
      }
    },
  })

  await fetchCheck('todays-pick', `${BASE}/api/todays-pick`, {
    validate: (body, res) => {
      if (res.status === 200 && body?.pick) return { ok: true, message: body.pick }
      if (res.status === 503) return { ok: true, message: 'no picks yet (503 expected)' }
      return { ok: false, message: `unexpected response: ${res.status}` }
    },
  })

  await fetchCheck('cron-newsletter-unauth', `${BASE}/api/cron-newsletter`, {
    expectStatus: 401,
  })

  await fetchCheck('legacy-newsletter-retired', `${BASE}/api/newsletter`, {
    method: 'POST',
    expectStatus: 410,
  })

  await fetchCheck('odds-proxy-sports', `${BASE}/api/picks-status?action=odds&path=/sports`, {
    validate: (body) => ({
      ok: Array.isArray(body) && body.some(s => s.key === 'baseball_mlb'),
      message: Array.isArray(body) ? `${body.length} sports` : 'not an array',
    }),
  })

  await fetchCheck('odds-proxy-mlb', `${BASE}/api/picks-status?action=odds&path=/sports/baseball_mlb/odds&regions=us&markets=h2h&oddsFormat=american`, {
    validate: (body, res) => {
      if (res.status !== 200) return { ok: false, message: `status ${res.status}` }
      if (!Array.isArray(body) || !body.length) return { ok: false, message: 'no MLB games returned' }
      return { ok: true, message: `${body.length} games` }
    },
  })

  for (const page of ['/', '/odds', '/picks', '/analysis', '/compare', '/blog', '/premium']) {
    await fetchCheck(`page${page}`, `${BASE}${page}`, {
      validate: (_body, res) => ({
        ok: res.status === 200,
        message: `HTTP ${res.status}`,
      }),
    })
  }

  await fetchCheck('sitemap', `${BASE}/api/sitemap`, {
    validate: (body) => ({
      ok: typeof body === 'string' && body.includes('<urlset'),
      message: 'xml sitemap',
    }),
  })

  const failed = checks.filter(c => !c.ok)
  const summary = {
    base: BASE,
    audited_at: new Date().toISOString(),
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    checks,
  }

  for (const c of checks) {
    const mark = c.ok ? 'PASS' : 'FAIL'
    console.log(`${mark}  ${c.name}${c.message ? ` — ${c.message}` : ''}${c.error ? ` — ${c.error}` : ''}`)
  }

  console.log(`\n${summary.passed}/${summary.total} passed`)
  if (failed.length) {
    console.error('\nFailures:')
    for (const f of failed) console.error(`  - ${f.name}: ${f.message || f.error}`)
  }

  if (logPath) {
    const dir = path.dirname(logPath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(logPath, JSON.stringify(summary, null, 2))
    console.log(`\nWrote log: ${logPath}`)
  }

  process.exit(failed.length ? 1 : 0)
}

run().catch(err => {
  console.error('Audit crashed:', err)
  process.exit(2)
})
