/** Supabase persistence for pick publish workflow. */

import { getSupabase } from './_supabase-client.js'
import {
  formatBetDisplay,
  resolvePickSport,
  parseAmericanOdds,
  formatConfidence,
} from './_pick-utils.js'
import { PICK_STATUS, PICK_TIER } from './_pick-lifecycle.js'

function pickToRow(pick, dateStr, sortOrder) {
  const oddsNum = parseAmericanOdds(pick.odds)
  const pickText = pick.pickSelection
  let betType = pick.betType
  if (/\bml\b/i.test(pickText) && (!betType || /^pick$/i.test(betType))) betType = 'ML'

  const tier = pick.tier === PICK_TIER.PREMIUM || pick.tier === 'premium'
    ? PICK_TIER.PREMIUM
    : PICK_TIER.FREE

  return {
    date: dateStr,
    sport: resolvePickSport({ sport: pick.sport, pick: pickText, game: pick.game, edge: pick.edge }),
    game: pick.game,
    pick: pickText,
    bet: formatBetDisplay(pick),
    bet_type: betType,
    odds: oddsNum,
    confidence: formatConfidence(pick.confidence),
    edge: pick.edge,
    recommendation: pick.recommendation || pick.pickMeta?.recommendation || null,
    pick_meta: pick.pickMeta || null,
    result: null,
    units: null,
    sort_order: sortOrder,
    tier,
    pick_number: pick.pick_number ?? (tier === PICK_TIER.FREE ? 1 : sortOrder),
    edge_score: pick.edgeScore ?? pick.pickMeta?.edge_score ?? null,
    status: pick.status || PICK_STATUS.APPROVED,
    approved_at: new Date().toISOString(),
    published_at: null,
    notification_sent_at: null,
  }
}

export async function storePickCandidates(picks, dateKey, { status = PICK_STATUS.APPROVED, forceRegenerate = false } = {}) {
  if (!picks?.length) return []

  const supabase = getSupabase()
  const rows = picks.map((pick, index) => pickToRow({ ...pick, status }, dateKey, index))

  if (!forceRegenerate) {
    const { data: existing } = await supabase
      .from('daily_picks')
      .select('id,pick,status,result')
      .eq('date', dateKey)

    const published = (existing || []).filter(r => r.status === PICK_STATUS.PUBLISHED)
    if (published.length) {
      return published
    }
  }

  const { data, error } = await supabase
    .from('daily_picks')
    .upsert(rows, { onConflict: 'date,pick' })
    .select('*')

  if (error) throw new Error(error.message)
  return data || []
}

export async function publishPickRow(supabase, row) {
  if (!row?.id) return { published: false, reason: 'missing_id' }
  if (row.status === PICK_STATUS.PUBLISHED) return { published: false, reason: 'already_published', row }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('daily_picks')
    .update({
      status: PICK_STATUS.PUBLISHED,
      published_at: now,
    })
    .eq('id', row.id)
    .eq('status', PICK_STATUS.APPROVED)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return { published: false, reason: 'not_approved' }

  return { published: true, row: data }
}

export async function fetchPublishLog(supabase, dateKey) {
  const { data } = await supabase
    .from('pick_publish_log')
    .select('*')
    .eq('date', dateKey)
    .maybeSingle()
  return data || null
}

export async function upsertPublishLog(supabase, dateKey, patch) {
  const existing = await fetchPublishLog(supabase, dateKey)
  const row = {
    date: dateKey,
    ...(existing || {}),
    ...patch,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('pick_publish_log').upsert(row, { onConflict: 'date' })
  if (error) console.warn('[publish-log]', error.message)
  return row
}
