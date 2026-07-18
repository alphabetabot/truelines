/**
 * Pick access tiers:
 * - Public: homepage + /free-picks show published free pick (no pick in email).
 * - Free account: pick alert emails link to site; one free pick daily when published.
 * - Premium: up to 3 premium picks daily (each published independently) + unlimited on-demand analysis.
 */
export const FREE_PUBLIC_PICK_COUNT = 1
export const FREE_DAILY_PICK_COUNT = 1
/** @deprecated Newsletter no longer includes pick content — notification only */
export const NEWSLETTER_EMAIL_PICK_COUNT = 1
export const DAILY_PREMIUM_SLATE_PICK_COUNT = 3
/** @deprecated Use DAILY_PREMIUM_SLATE_PICK_COUNT */
export const DAILY_NEWSLETTER_PICK_COUNT = DAILY_PREMIUM_SLATE_PICK_COUNT
export const PREMIUM_PRICE_DISPLAY = '$19.95/mo'
