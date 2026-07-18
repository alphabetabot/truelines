/**
 * Pick pipeline: analyze → approve → publish → notify.
 * Morning pick-in-email delivery has been retired.
 */
import { postTweet } from './_post-to-x.js'
import { extractPicksFromResponse, extractTopPickSection, storePicks } from './_store-picks.js'
import { resolvePicksForPublish } from './_pick-metrics.js'
import { getTodaysGames, generatePicks } from './_newsletter-slate.js'
import { fetchTopDailyPickSafe } from './_newsletter-recovery.js'
import { runEmailOnlyDelivery } from './_newsletter-recovery.js'
import {
  PIPELINE,
  beginGeneratePhase,
  fetchNewsletterRow,
  getPipelinePhase,
  isNewsletterSendComplete,
  isStaleNewsletterClaim,
  markPipelinePhase,
  persistNewsletterDraft,
  recordNewsletterFailure,
} from './_newsletter-send-guard.js'

function normalizeMatchupKey(game) {
  return String(game || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function mergeEnginePickMeta(extracted, enginePicks) {
  const byGame = new Map(
    (enginePicks || []).map(p => [normalizeMatchupKey(p.game), p])
  )
  return (extracted || []).map(pick => {
    const engine = byGame.get(normalizeMatchupKey(pick.game))
    if (!engine) return pick
    return {
      ...pick,
      recommendation: pick.recommendation || engine.recommendation,
      pickMeta: engine.pickMeta,
      odds: pick.odds ?? engine.odds,
      engineGenerated: engine.engineGenerated,
    }
  })
}

export function resolveNewsletterStep(req) {
  const step = String(req.query?.step || req.body?.step || '').toLowerCase()
  if (step === 'generate' || step === 'send' || step === 'social' || step === 'pipeline' || step === 'all') return step
  if (req.query?.catchup === 'true' || req.body?.catchup === true) return 'send'
  if (req.query?.emailsOnly === 'true' || req.body?.emailsOnly === true) return 'send'
  return 'all'
}

function dateLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function runGenerateStep({
  supabase,
  todayKey,
  forceRegenerate = false,
}) {
  const row = await fetchNewsletterRow(supabase, todayKey)
  const storedTopPick = await fetchTopDailyPickSafe(supabase, todayKey)
  const phase = getPipelinePhase(row)

  if (isNewsletterSendComplete(row)) {
    return { ok: true, skipped: true, reason: 'already_sent_today', step: 'generate', phase }
  }

  if ((phase === 'picks_ready' || storedTopPick) && !forceRegenerate) {
    return {
      ok: true,
      skipped: true,
      reason: 'picks_already_stored',
      step: 'generate',
      phase: 'picks_ready',
      stored: Boolean(storedTopPick),
    }
  }

  if (phase === 'generating' && row && !isStaleNewsletterClaim(row) && !forceRegenerate) {
    return {
      ok: true,
      skipped: true,
      reason: 'generate_in_progress',
      step: 'generate',
      phase,
      started_at: row.started_at,
    }
  }

  await beginGeneratePhase(supabase, todayKey)

  let picksText = ''
  try {
    const games = await getTodaysGames()
    if (!games.length) {
      await recordNewsletterFailure(supabase, todayKey, 'No games today')
      return { ok: true, skipped: true, reason: 'no_games', step: 'generate' }
    }

    const generated = await generatePicks(games)
    picksText = generated.picksText || ''
    const slate = generated.slate || []

    if (!picksText || picksText.trim().length < 100) {
      await recordNewsletterFailure(supabase, todayKey, 'No picks generated', { picksText })
      return { ok: false, reason: 'no_picks_generated', step: 'generate' }
    }

    if (
      picksText.includes('cannot responsibly') ||
      picksText.includes('cannot generate') ||
      picksText.includes('insufficient data')
    ) {
      await recordNewsletterFailure(supabase, todayKey, 'Claude refused to generate picks', { picksText })
      return { ok: false, reason: 'claude_refused', step: 'generate' }
    }

    const extracted = extractPicksFromResponse(picksText).filter(p => !p.isFade)
    const enginePicks = (generated.mlbEnginePicks || []).map(ep => ({
      ...ep,
      recommendation: ep.recommendation || ep.pickMeta?.recommendation,
    }))
    const mergedExtracted = mergeEnginePickMeta(extracted, enginePicks)
    const { picks, warnings, tier } = resolvePicksForPublish(mergedExtracted, slate, { enginePicks })
    if (warnings.length) console.warn('[pipeline:generate] quality warnings:', warnings.join(' | '))

    if (!picks.length) {
      await recordNewsletterFailure(supabase, todayKey, 'No publishable picks', {
        picksText,
        pipelineStatus: PIPELINE.GENERATE_FAILED,
      })
      return {
        ok: false,
        reason: 'no_publishable_picks',
        step: 'generate',
        warnings: warnings.slice(0, 10),
        picksPreview: picksText.slice(0, 500),
      }
    }

    const storedPicks = await storePicks(picks, new Date())
    if (!storedPicks.length) {
      await recordNewsletterFailure(supabase, todayKey, 'Failed to store picks', { picksText })
      return { ok: false, reason: 'store_failed', step: 'generate', extracted: picks.length }
    }

    await persistNewsletterDraft(supabase, todayKey, picksText)
    await markPipelinePhase(supabase, todayKey, PIPELINE.PICKS_READY, { picksText })

    return {
      ok: true,
      step: 'generate',
      phase: 'picks_ready',
      stored: storedPicks.length,
      tier,
      date: todayKey,
      message: `Stored ${storedPicks.length} picks — send step will deliver email`,
    }
  } catch (err) {
    await recordNewsletterFailure(supabase, todayKey, err.message || 'Generate failed', {
      picksText: picksText || undefined,
    })
    throw err
  }
}

export async function runSendStep({
  supabase,
  resend,
  todayKey,
  forceSend = false,
  catchup = false,
}) {
  // Morning pick emails retired — notifications fire on publish via cron-pick-pipeline.
  return {
    ok: true,
    skipped: true,
    reason: 'pick_email_retired',
    step: 'send',
    message: 'Pick emails are sent on publish via /api/cron-pick-pipeline, not on a morning schedule.',
  }
}

export async function runSocialStep({ supabase, todayKey }) {
  const row = await fetchNewsletterRow(supabase, todayKey)
  const phase = getPipelinePhase(row)

  if (!isNewsletterSendComplete(row)) {
    return {
      ok: true,
      skipped: true,
      reason: 'email_not_sent_yet',
      step: 'social',
      phase,
    }
  }

  if (row?.cron_schedule === PIPELINE.SOCIAL_DONE) {
    return { ok: true, skipped: true, reason: 'social_already_posted', step: 'social' }
  }

  const picksText = row?.picks_text || ''
  const topPickSection = extractTopPickSection(picksText)
  const pickLine = topPickSection.match(/\*\*(.+Pick.+?)\*\*/)?.[1]?.trim() || ''
  const edgeLine = topPickSection.match(/- Edge: (.+)/)?.[1]?.trim() || ''
  const betLine = topPickSection.match(/- Bet: (.+)/)?.[1]?.trim() || ''
  const label = dateLabel()

  if (!pickLine || !betLine) {
    return {
      ok: true,
      skipped: true,
      reason: 'no_social_copy',
      step: 'social',
    }
  }

  const posts = { telegram: false, x: false }

  try {
    const tgMessage = `TOP PICK — ${label}\n\n ${pickLine}\n ${betLine}\n\n ${edgeLine}\n\nFull analysis: trueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`
    const tgRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, text: tgMessage }),
    })
    posts.telegram = tgRes.ok
  } catch (err) {
    console.warn('Telegram post failed:', err.message)
  }

  try {
    const tweet = `TOP PICK — ${label}\n\n${pickLine}\n${betLine}\n\n${edgeLine}\n\nFull analysis: trueoddsiq.com/picks\n\n#SportsBetting #VegaPicks`.slice(0, 280)
    await postTweet(tweet)
    posts.x = true
  } catch (err) {
    console.warn('X post failed:', err.message)
  }

  await markPipelinePhase(supabase, todayKey, PIPELINE.SOCIAL_DONE, {
    picksText: row?.picks_text,
    subscriberCount: row?.subscriber_count,
    sentAt: row?.sent_at,
  })

  return {
    ok: true,
    step: 'social',
    phase: 'social_done',
    posts,
    date: todayKey,
  }
}

export async function runAllSteps({ supabase, resend, todayKey, forceRegenerate = false, forceSend = false }) {
  const generate = await runGenerateStep({ supabase, todayKey, forceRegenerate })
  if (!generate.ok && !generate.skipped) {
    return { ok: false, steps: { generate } }
  }

  const send = await runSendStep({ supabase, resend, todayKey, forceSend })
  if (!send.ok && !send.skipped) {
    return { ok: false, steps: { generate, send } }
  }

  const social = await runSocialStep({ supabase, todayKey })
  return { ok: true, steps: { generate, send, social }, date: todayKey }
}
