import {
  buildNewsletterEmailHtml,
  buildNewsletterEmailPlainText,
  sendNewsletterEmail,
  unsubscribeUrl,
} from './_newsletter-utils.js'
import { extractTopPickSection } from './_store-picks.js'
import { uniqueSubscriberEmails } from './_newsletter-send-guard.js'

const DEFAULT_BATCH_SIZE = 20

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
    const results = await Promise.allSettled(
      batch.map(async email => {
        const unsub = unsubscribeUrl(email)
        await sendNewsletterEmail({
          resend,
          to: email,
          subject,
          html: buildNewsletterEmailHtml(topPickText, dateLabel, unsub),
          text: buildNewsletterEmailPlainText(topPickText, dateLabel, unsub),
        })
        return email
      }),
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled') {
        sent++
      } else {
        failures.push({ email: batch[j], error: result.reason?.message || 'send failed' })
      }
    }
  }

  return {
    sent,
    failed: failures.length,
    failures,
    recipients: emails.length,
  }
}
