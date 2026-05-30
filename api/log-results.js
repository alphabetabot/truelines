// Grade pending picks, verify recent graded picks (integrity pass), store W/L + units

import { requireCronAuth } from './auth-utils.js'
import { parseAmericanOdds, profitUnits, resolvePickGrade } from './pick-utils.js'
import { addDays, fetchFinalGamesForPicks } from './grading-scores.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

function resolveOdds(pick) {
  if (pick.odds != null && pick.odds !== '') {
    const n = typeof pick.odds === 'number' ? pick.odds : parseAmericanOdds(pick.odds)
    if (n) return n
  }
  if (pick.bet) return parseAmericanOdds(pick.bet)
  return null
}

function integrityWindowDays() {
  const raw = parseInt(process.env.REGRADE_DAYS || '45', 10)
  return Number.isNaN(raw) ? 45 : Math.min(90, Math.max(7, raw))
}

function isRegradeOnlyRequest(req) {
  const q = req.query?.regrade
  return q === '1' || q === 'true' || q === 'recent'
}

function skipIntegrityPass(req) {
  return req.query?.pendingOnly === '1' || req.query?.pendingOnly === 'true'
}

async function supabasePicks(pathAndQuery) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?${pathAndQuery}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
  if (!res.ok) return { error: res.status, picks: [] }
  return { picks: await res.json() }
}

async function fetchPendingPicks() {
  return supabasePicks('select=*&result=is.null&limit=250&order=date.asc')
}

async function fetchGradedPicksSince(sinceDate) {
  const res = await supabasePicks(
    `select=*&date=gte.${sinceDate}&order=date.asc&limit=800`
  )
  if (res.error) return res
  return {
    picks: res.picks.filter(p => p.result && String(p.result).trim() !== ''),
    sinceDate,
  }
}

async function patchPick(pick, result, units) {
  const body = JSON.stringify({ result, units })
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${pick.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (updateRes.ok) return true

  const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?id=eq.${pick.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ result }),
  })
  return retryRes.ok
}

function unitsChanged(stored, computed) {
  const a = parseFloat(stored)
  const b = parseFloat(computed)
  if (Number.isNaN(a) && Number.isNaN(b)) return false
  if (Number.isNaN(a) || Number.isNaN(b)) return true
  return Math.abs(a - b) > 0.009
}

async function processPickBatch(picks, games, log, { verifyOnly }) {
  let updated = 0
  let corrected = 0

  for (const pick of picks) {
    const graded = resolvePickGrade(pick, games, { addDaysFn: addDays, resolveOdds })

    if (graded.skipReason) {
      log.push(`SKIP: ${pick.pick} (${pick.date}) — ${graded.skipReason}`)
      continue
    }

    const { result, units, previous } = graded
    const resultChanged = previous !== result
    const unitsNeedFix = unitsChanged(pick.units, units)

    if (verifyOnly && !resultChanged && !unitsNeedFix) continue

    const ok = await patchPick(pick, result, units)
    if (!ok) {
      log.push(`FAIL: ${pick.pick} (${pick.date}) — database update failed`)
      continue
    }

    const tag = resultChanged ? `FIXED ${previous}->` : unitsNeedFix ? 'UNITS ' : ''
    log.push(
      `UPDATED: ${pick.pick} (${pick.date}) = ${tag}${result} (${units > 0 ? '+' : ''}${units.toFixed(2)}u) · ${graded.game.away_score}-${graded.game.home_score} ${graded.game.game_date}`
    )
    updated++
    if (resultChanged) corrected++
  }

  return { updated, corrected }
}

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return

  const regradeOnly = isRegradeOnlyRequest(req)
  const log = []

  try {
    log.push(`START: log-results${regradeOnly ? ' (regrade-only)' : ''}`)

    const today = new Date()
    const since = new Date(today)
    since.setDate(since.getDate() - integrityWindowDays())
    const sinceDate = since.toISOString().split('T')[0]

    const pendingRes = regradeOnly ? { picks: [] } : await fetchPendingPicks()
    if (pendingRes.error) {
      log.push(`ERROR: Failed to fetch pending picks (${pendingRes.error})`)
      return res.status(500).json({ success: false, log })
    }

    const gradedRes = await fetchGradedPicksSince(sinceDate)
    if (gradedRes.error) {
      log.push(`ERROR: Failed to fetch graded picks (${gradedRes.error})`)
      return res.status(500).json({ success: false, log })
    }

    const allPicks = regradeOnly ? gradedRes.picks : [...pendingRes.picks, ...gradedRes.picks]

    log.push(
      `PICKS: ${pendingRes.picks.length} pending, ${gradedRes.picks.length} graded since ${sinceDate} (integrity window ${integrityWindowDays()}d)`
    )

    if (allPicks.length === 0) {
      return res.json({ success: true, log, updated: 0, corrected: 0 })
    }

    const { games, startDate, endDate } = await fetchFinalGamesForPicks(allPicks)
    log.push(`GAMES: ${games.length} finals loaded (MLB ${startDate}→${endDate}; NBA/NHL last 3d via Odds API)`)

    let totalUpdated = 0
    let totalCorrected = 0

    if (!regradeOnly && pendingRes.picks.length > 0) {
      log.push('--- Pending picks ---')
      const r = await processPickBatch(pendingRes.picks, games, log, { verifyOnly: false })
      totalUpdated += r.updated
      totalCorrected += r.corrected
    }

    if (!skipIntegrityPass(req) && gradedRes.picks.length > 0) {
      log.push('--- Integrity verify (re-check graded) ---')
      const r = await processPickBatch(gradedRes.picks, games, log, { verifyOnly: true })
      totalUpdated += r.updated
      totalCorrected += r.corrected
    }

    log.push(`SUCCESS: ${totalUpdated} row(s) written, ${totalCorrected} result(s) corrected`)
    return res.json({
      success: true,
      updated: totalUpdated,
      corrected: totalCorrected,
      integrityDays: integrityWindowDays(),
      scoreWindow: { startDate, endDate },
      log,
    })
  } catch (err) {
    log.push(`FATAL: ${err.message}`)
    return res.status(500).json({ success: false, log, error: err.message })
  }
}
