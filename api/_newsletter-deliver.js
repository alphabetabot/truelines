import {
  buildNewsletterEmailHtml,
  buildNewsletterEmailPlainText,
  sendNewsletterEmail,
  unsubscribeUrl,
} from './_newsletter-utils.js'
import { extractTopPickSection } from './_store-picks.js'
import { uniqueSubscriberEmails } from './_newsletter-send-guard.js'

const DEFAULT_BATCH_SIZE = 4
/** Resend allows ~5 requests/sec — stay under with spacing + retries. */
const RESEND_MIN_INTERVAL_MS = 250
const RATE_LIMIT_RETRY_MS = 1500
const MAX_SEND_ATTEMPTS = 4

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRateLimitError(err) {
  const msg = String(err?.message || err?.error || err || '')
  return /too many requests/i.test(msg) || /rate limit/i.test(msg)
}

async function sendOneNewsletterEmail({ resend, email, subject, topPickText, dateLabel }) {
  const unsub = unsubscribeUrl(email)
  let lastError
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      await sendNewsletterEmail({
        resend,
        to: email,
        subject,
        html: buildNewsletterEmailHtml(topPickText, dateLabel, unsub),
        text: buildNewsletterEmailPlainText(topPickText, dateLabel, unsub),
      })
      return email
    } catch (err) {
      lastError = err
      if (!isRateLimitError(err) || attempt === MAX_SEND_ATTEMPTS) throw err
      await sleep(RATE_LIMIT_RETRY_MS * attempt)
    }
  }
  throw lastError
}

/** Rebuild a sendable top-pick block when picks_text was lost but daily_picks exist. */
export function buildTopPickFromDailyPickRow(row) {
  if (!row) return ''
  const sport = row.sport || 'MLB'
  const game = row.game || ''
  const pick = row.pick || ''
  const bet = row.bet || ''
  const confidence = row.confidence || '★★★☆☆'
  const edge = row.edge || 'Full write-up at trueoddsiq.com/picks'

  return [
    'TOP PICK OF THE DAY',
    game,
    `**${sport} Pick: ${pick}**`,
    `- Bet: ${bet}`,
    `- Confidence: ${confidence}`,
    `- Edge: ${edge}`,
  ].join('\n')
}

export function isUsableTopPickText(text) {
  const trimmed = String(text || '').trim()
  if (trimmed.length < 40) return false
  if (/- Bet:/i.test(trimmed)) return true
  if (/\*\*[^*]+Pick:[^*]+\*\*/i.test(trimmed)) return true
  if (/\bTOP PICK\b/i.test(trimmed) && (/@/.test(trimmed) || /- Edge:/i.test(trimmed))) return true
  return false
}

export function resolveTopPickText(picksText, dailyPickRow) {
  const fromClaude = extractTopPickSection(picksText)
  if (isUsableTopPickText(fromClaude)) return fromClaude
  const fromRow = buildTopPickFromDailyPickRow(dailyPickRow)
  if (isUsableTopPickText(fromRow)) return fromRow
  return fromClaude || fromRow
}

/**
 * Send newsletter emails in parallel batches (Resend is per-recipient).
 * Returns counts so callers can record partial success.
 */
export async function deliverNewsletterEmails({
  resend,
  subscribers,
  topPickText,
  dateLabel,
  batchSize = DEFAULT_BATCH_SIZE,
}) {
  const emails = uniqueSubscriberEmails(subscribers)
  if (!emails.length) {
    return { sent: 0, failed: 0, failures: [], recipients: 0 }
  }

  if (!isUsableTopPickText(topPickText)) {
    throw new Error('Top pick text is missing bet/pick details for newsletter email')
  }

  const subject = `TrueOddsIQ Top Pick — ${dateLabel}`
  let sent = 0
  const failures = []

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j++) {
      const email = batch[j]
      try {
        await sendOneNewsletterEmail({
          resend,
          email,
          subject,
          topPickText,
          dateLabel,
        })
        sent++
      } catch (err) {
        failures.push({ email, error: err?.message || 'send failed' })
      }
      if (j < batch.length - 1 || i + batchSize < emails.length) {
        await sleep(RESEND_MIN_INTERVAL_MS)
      }
    }
  }

  // Final retry pass for rate-limited failures only
  const rateLimited = failures.filter(f => isRateLimitError(f))
  if (rateLimited.length) {
    await sleep(RATE_LIMIT_RETRY_MS)
    const nonRate = failures.filter(f => !isRateLimitError(f))
    failures.length = 0
    failures.push(...nonRate)
    for (const { email } of rateLimited) {
      try {
        await sendOneNewsletterEmail({
          resend,
          email,
          subject,
          topPickText,
          dateLabel,
        })
        sent++
      } catch (err) {
        failures.push({ email, error: err?.message || 'send failed' })
      }
      await sleep(RESEND_MIN_INTERVAL_MS)
    }
  }

  return {
    sent,
    failed: failures.length,
    failures,
    recipients: emails.length,
  }
}
