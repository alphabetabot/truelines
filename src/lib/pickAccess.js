/**
 * Pick access tiers:
 * - Public: FREE_PUBLIC_PICK_COUNT pick preview on homepage (via /api/todays-pick).
 * - Free account: live odds, line compare, newsletter email (one top pick), public tracker.
 * - Premium: /picks + /analysis, full DAILY_PREMIUM_SLATE_PICK_COUNT-pick slate, unlimited AI research.
 */
export const FREE_PUBLIC_PICK_COUNT = 1
/** Top pick only — full write-up in the morning newsletter email. */
export const NEWSLETTER_EMAIL_PICK_COUNT = 1
/** Full daily card stored for Premium subscribers on /picks. */
export const DAILY_PREMIUM_SLATE_PICK_COUNT = 3
/** @deprecated Use DAILY_PREMIUM_SLATE_PICK_COUNT */
export const DAILY_NEWSLETTER_PICK_COUNT = DAILY_PREMIUM_SLATE_PICK_COUNT
export const PREMIUM_PRICE_DISPLAY = '$19.95/mo'
