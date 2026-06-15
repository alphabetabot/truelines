import { Resend } from 'resend'
import { getSupabase } from './_supabase-client.js'
import {
  NEWSLETTER_CATCHUP_SCHEDULE,
  NEWSLETTER_GENERATE_SCHEDULE,
  NEWSLETTER_SEND_SCHEDULE,
  NEWSLETTER_SOCIAL_SCHEDULE,
  getPacificDateKey,
  releaseNewsletterClaim,
} from './_newsletter-send-guard.js'
import {
  resolveNewsletterStep,
  runAllSteps,
  runGenerateStep,
  runSendStep,
  runSocialStep,
} from './_newsletter-pipeline.js'

let resendClient = null

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

function isCronAuthorized(req) {
  const authHeader = String(req.headers?.authorization || req.headers?.Authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  return Boolean(process.env.CRON_SECRET && token === process.env.CRON_SECRET)
}

function expectedScheduleForStep(step) {
  if (step === 'generate') return NEWSLETTER_GENERATE_SCHEDULE
  if (step === 'send') return NEWSLETTER_SEND_SCHEDULE
  if (step === 'social') return NEWSLETTER_SOCIAL_SCHEDULE
  return null
}

export default async function handler(req, res) {
  try {
    return await runNewsletterHandler(req, res)
  } catch (err) {
    console.error('Newsletter fatal error:', err)
    return res.status(500).json({
      error: err.message || 'Newsletter failed',
      code: 'newsletter_fatal',
    })
  }
}

async function runNewsletterHandler(req, res) {
  const secret = req.headers['x-newsletter-secret']
  const isVercelCron = isCronAuthorized(req)
  const forceSend = req.query?.force === 'true' || req.body?.force === true
  const forceRegenerate = req.query?.regenerate === 'true' || req.body?.regenerate === true
  const catchupSend = req.query?.catchup === 'true' || req.body?.catchup === true
  const step = resolveNewsletterStep(req)

  if (!isVercelCron && secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!forceSend && !isVercelCron) {
    return res.json({
      sent: 0,
      skipped: true,
      reason: 'external_trigger_disabled',
      message:
        'Newsletter runs via Vercel cron (generate 0 14 UTC, send 30 14 UTC) or ?force=true with CRON_SECRET.',
    })
  }

  const cronSchedule = req.headers['x-vercel-cron-schedule'] || null
  const expected = expectedScheduleForStep(step)
  if (isVercelCron && !forceSend && expected && cronSchedule && cronSchedule !== expected) {
    console.warn(`Newsletter step=${step} on schedule ${cronSchedule} (expected ${expected}) — continuing`)
  }

  const todayKey = getPacificDateKey(new Date())
  const supabase = getSupabase()

  if (forceSend && step === 'all') {
    await releaseNewsletterClaim(supabase, todayKey)
  }

  const ctx = {
    supabase,
    resend: getResend(),
    todayKey,
    forceRegenerate: forceRegenerate || (forceSend && step === 'generate'),
    forceSend,
    catchup: catchupSend,
  }

  let result
  if (step === 'generate') {
    result = await runGenerateStep(ctx)
  } else if (step === 'send') {
    result = await runSendStep(ctx)
    if (!result.ok && result.failed > 0) {
      return res.status(502).json(result)
    }
  } else if (step === 'social') {
    result = await runSocialStep(ctx)
  } else {
    result = await runAllSteps(ctx)
    const send = result.steps?.send
    if (send && !send.ok && send.failed > 0) {
      return res.status(502).json(result)
    }
  }

  const status = result.ok === false ? 500 : 200
  return res.status(status).json({ date: todayKey, step, ...result })
}
