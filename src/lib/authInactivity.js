/** Shared inactivity logout helpers (testable without React). */

export const INACTIVITY_SIGN_OUT_MS = 10 * 60 * 1000
export const INACTIVITY_CHECK_INTERVAL_MS = 30 * 1000
export const ACTIVITY_THROTTLE_MS = 1000

/** Intentional user input only — not scroll (auto-refresh/layout can fire scroll). */
export const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'pointerdown']

export function isIdleExpired(lastActivityAt, now = Date.now(), thresholdMs = INACTIVITY_SIGN_OUT_MS) {
  if (!Number.isFinite(lastActivityAt)) return false
  return now - lastActivityAt >= thresholdMs
}

export function mergeAuthUser(prev, session) {
  const next = session?.user ?? null
  if (prev?.id === next?.id) return prev
  return next
}
