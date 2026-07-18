/** Pick lifecycle states for the publish + notify workflow. */

export const PICK_STATUS = {
  DRAFT: 'draft',
  ANALYSIS_RUNNING: 'analysis_running',
  QUALITY_CHECKS: 'quality_checks',
  APPROVED: 'approved',
  PUBLISHED: 'published',
}

export const PICK_TIER = {
  FREE: 'free',
  PREMIUM: 'premium',
}

export const LIFECYCLE_ORDER = [
  PICK_STATUS.DRAFT,
  PICK_STATUS.ANALYSIS_RUNNING,
  PICK_STATUS.QUALITY_CHECKS,
  PICK_STATUS.APPROVED,
  PICK_STATUS.PUBLISHED,
]

export function canTransition(from, to) {
  const fromIdx = LIFECYCLE_ORDER.indexOf(from)
  const toIdx = LIFECYCLE_ORDER.indexOf(to)
  if (fromIdx < 0 || toIdx < 0) return false
  return toIdx === fromIdx + 1 || (from === PICK_STATUS.APPROVED && to === PICK_STATUS.PUBLISHED)
}

export function isPublishedPick(row) {
  return row?.status === PICK_STATUS.PUBLISHED || Boolean(row?.published_at)
}

export function isVisibleOnSite(row) {
  if (!row) return false
  if (row.status) return row.status === PICK_STATUS.PUBLISHED
  return Boolean(row.published_at) || !row.status
}
