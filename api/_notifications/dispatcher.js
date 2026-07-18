import { NOTIFICATION_CHANNELS } from './events.js'
import { handleEmailNotification } from './handlers/email.js'

const channelHandlers = {
  [NOTIFICATION_CHANNELS.EMAIL]: handleEmailNotification,
}

/**
 * Dispatch a publish notification to all registered channel handlers.
 * Future: push, SMS, browser — register handlers here without changing publish logic.
 */
export async function dispatchNotification(event, ctx) {
  const results = {}

  for (const [channel, handler] of Object.entries(channelHandlers)) {
    if (!handler) continue
    try {
      results[channel] = await handler(event, ctx)
    } catch (err) {
      results[channel] = { error: err?.message || 'handler failed' }
      console.error(`[notifications:${channel}]`, err)
    }
  }

  return results
}
