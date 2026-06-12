/** Comma-separated owner/admin emails — always get Premium (no Stripe required). */
function adminEmailList() {
  const raw = process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || ''
  return raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email) {
  if (!email) return false
  const list = adminEmailList()
  if (!list.length) return false
  return list.includes(String(email).trim().toLowerCase())
}

export function isAdminUser(user) {
  if (!user) return false
  return isAdminEmail(user.email)
}
