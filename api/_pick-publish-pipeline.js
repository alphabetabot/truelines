/**
 * Pick publish pipeline — analyze → quality checks → approve → publish → notify.
 * Emails fire only on publish, never on a fixed morning clock.
 */
import { extractPicksFromResponse } from './_store-picks.js'
import { resolvePicksForPublish } from './_pick-metrics.js'
import { getTodaysGames, generatePicks } from './_newsletter-slate.js'
import { scoreGameEdge } from './_edge-engine/index.js'
import { analyzeMlbSlate, engineAnalysisToPick } from './_mlb-engine/index.js'
import { PICK_STATUS, PICK_TIER } from './_pick-lifecycle.js'
import { NOTIFICATION_EVENTS } from './_notifications/events.js'
import { dispatchNotification } from './_notifications/dispatcher.js'
import { storePickCandidates, publishPickRow, fetchPublishLog, upsertPublishLog } from './_pick-publish-store.js'
import { getPacificDateKey } from './_newsletter-send-guard.js'

/** End of publishing window (Pacific hour, 24h). No-bet email after this if no free pick. */
export const PUBLISH_WINDOW_END_HOUR_PT = 18

function normalizeMatchupKey(game) {
  return String(game || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function mergeEnginePickMeta(extracted, enginePicks) {
  const byGame = new Map((enginePicks || []).map(p => [normalizeMatchupKey(p.game), p]))
  return (extracted || []).map(pick => {
    const engine = byGame.get(normalizeMatchupKey(pick.game))
    if (!engine) return pick
    return {
      ...pick,
      recommendation: pick.recommendation || engine.recommendation,
      pickMeta: { ...(pick.pickMeta || {}), ...(engine.pickMeta || {}) },
      odds: pick.odds ?? engine.odds,
    }
  })
}

function pacificHour(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  return Number(parts.find(p => p.type === 'hour')?.value || 0)
}

function attachEdgeScores(picks, slate, mlbAnalyses) {
  const analysisByGame = new Map(
    (mlbAnalyses || []).map(({ game, analysis }) => [
      normalizeMatchupKey(`${game.away} @ ${game.home}`),
      analysis,
    ]),
  )

  return (picks || []).map(pick => {
    const entry = (slate || []).find(e =>
      normalizeMatchupKey(pick.game).includes(normalizeMatchupKey(e.away))
      && normalizeMatchupKey(pick.game).includes(normalizeMatchupKey(e.home)),
    )
    const mlbAnalysis = analysisByGame.get(normalizeMatchupKey(pick.game))
    const tier = pick.tier === PICK_TIER.PREMIUM ? 'premium' : 'free'
    const edge = scoreGameEdge(entry || { sport: pick.sport, stats: {} }, {
      mlbAnalysis,
      pickMeta: pick.pickMeta,
      tier,
    })

    return {
      ...pick,
      edgeScore: edge.edgeScore,
      edgeCategories: edge.categories,
      pickMeta: {
        ...(pick.pickMeta || {}),
        edge_score: edge.edgeScore,
        edge_categories: edge.categories,
        confidence_score: edge.confidenceScore,
        key_reasons: edge.keyReasons,
        risk_factors: edge.riskFactors,
        expected_value: edge.expectedValue,
        fair_odds: edge.fairOdds,
      },
      edgeAnalysis: edge,
    }
  })
}

function passesEdgeGate(pick) {
  const tier = pick.tier === PICK_TIER.PREMIUM ? 'premium' : 'free'
  if (tier === 'free') return pick.edgeAnalysis?.passesFree !== false && (pick.edgeScore ?? 0) >= 68
  return pick.edgeAnalysis?.passesPremium !== false && (pick.edgeScore ?? 0) >= 65
}

/**
 * Run analysis and store approved pick candidates (not yet published).
 */
export async function runPickAnalysisStep({ supabase, todayKey, forceRegenerate = false }) {
  const games = await getTodaysGames()
  if (!games.length) {
    return { ok: true, skipped: true, reason: 'no_games', step: 'analyze' }
  }

  const mlbAnalyses = analyzeMlbSlate(games)
  const enginePicks = mlbAnalyses
    .map(({ analysis }) => engineAnalysisToPick(analysis))
    .filter(Boolean)

  const generated = await generatePicks(games)
  const picksText = generated.picksText || ''
  const slate = generated.slate || games

  if (!picksText || picksText.trim().length < 100) {
    return { ok: false, reason: 'no_picks_generated', step: 'analyze' }
  }

  const extracted = extractPicksFromResponse(picksText).filter(p => !p.isFade)
  const merged = mergeEnginePickMeta(extracted, enginePicks)
  const { picks, warnings, tier, freePick, premiumPicks } = resolvePicksForPublish(merged, slate, { enginePicks })

  if (!picks.length) {
    return { ok: true, skipped: true, reason: 'no_publishable_picks', warnings, step: 'analyze' }
  }

  const scored = attachEdgeScores(picks, slate, mlbAnalyses)
  const approved = scored.filter(passesEdgeGate)

  if (!approved.length) {
    return { ok: true, skipped: true, reason: 'no_edge_approved_picks', warnings, step: 'analyze' }
  }

  const stored = await storePickCandidates(approved, todayKey, {
    status: PICK_STATUS.APPROVED,
    forceRegenerate,
  })

  await upsertPublishLog(supabase, todayKey, { last_pipeline_run_at: new Date().toISOString() })

  return {
    ok: true,
    step: 'analyze',
    stored: stored.length,
    tier,
    freePick: Boolean(freePick),
    premiumCount: premiumPicks?.length || 0,
    warnings: warnings?.slice(0, 10),
  }
}

/**
 * Publish approved picks that are not yet live; send notification per pick.
 */
export async function runPickPublishStep({ supabase, resend, todayKey }) {
  const { data: approvedRows, error } = await supabase
    .from('daily_picks')
    .select('*')
    .eq('date', todayKey)
    .eq('status', PICK_STATUS.APPROVED)
    .order('sort_order', { ascending: true })

  if (error) {
    return { ok: false, reason: 'fetch_approved_failed', error: error.message }
  }

  const published = []
  for (const row of approvedRows || []) {
    const result = await publishPickRow(supabase, row)
    if (!result.published) continue

    const eventType = row.tier === PICK_TIER.PREMIUM
      ? NOTIFICATION_EVENTS.PREMIUM_PICK_PUBLISHED
      : NOTIFICATION_EVENTS.FREE_PICK_PUBLISHED

    const notify = await dispatchNotification(
      { type: eventType, pick: result.row },
      { supabase, resend },
    )

    await supabase
      .from('daily_picks')
      .update({ notification_sent_at: new Date().toISOString() })
      .eq('id', result.row.id)

    published.push({ id: result.row.id, tier: row.tier, notifications: notify })
  }

  const log = await fetchPublishLog(supabase, todayKey)
  const freePublished = published.some(p => p.tier === PICK_TIER.FREE || p.tier === 'free')
  if (freePublished) {
    await upsertPublishLog(supabase, todayKey, { free_pick_published: true })
  }
  if (published.some(p => p.tier === PICK_TIER.PREMIUM || p.tier === 'premium')) {
    await upsertPublishLog(supabase, todayKey, {
      premium_picks_published: (log?.premium_picks_published || 0) + published.filter(p => p.tier === 'premium').length,
    })
  }

  return { ok: true, step: 'publish', published: published.length, picks: published }
}

/**
 * After publishing window, notify free list if no free pick went live.
 */
export async function runNoFreePickNotification({ supabase, resend, todayKey, now = new Date() }) {
  const hour = pacificHour(now)
  if (hour < PUBLISH_WINDOW_END_HOUR_PT) {
    return { ok: true, skipped: true, reason: 'before_window_end' }
  }

  const log = await fetchPublishLog(supabase, todayKey)
  if (log?.free_pick_published || log?.no_free_pick_notified) {
    return { ok: true, skipped: true, reason: 'already_handled' }
  }

  const { count } = await supabase
    .from('daily_picks')
    .select('id', { count: 'exact', head: true })
    .eq('date', todayKey)
    .eq('tier', PICK_TIER.FREE)
    .eq('status', PICK_STATUS.PUBLISHED)

  if ((count || 0) > 0) {
    await upsertPublishLog(supabase, todayKey, { free_pick_published: true })
    return { ok: true, skipped: true, reason: 'free_pick_exists' }
  }

  const notify = await dispatchNotification(
    { type: NOTIFICATION_EVENTS.NO_FREE_PICK_TODAY },
    { supabase, resend },
  )

  await upsertPublishLog(supabase, todayKey, { no_free_pick_notified: true })

  return { ok: true, step: 'no_free_pick_notify', notifications: notify }
}

export async function runPickPipeline({ supabase, resend, todayKey, forceRegenerate = false }) {
  const analyze = await runPickAnalysisStep({ supabase, todayKey, forceRegenerate })
  const publish = await runPickPublishStep({ supabase, resend, todayKey })
  const noPick = await runNoFreePickNotification({ supabase, resend, todayKey })

  return {
    ok: true,
    date: todayKey,
    analyze,
    publish,
    noPick,
  }
}

export { getPacificDateKey }
