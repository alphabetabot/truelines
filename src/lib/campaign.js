/** True when visitor likely arrived from paid/owned campaign (?utm_* or ?welcome=1). */
export function isCampaignLanding(search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  return (
    params.has('utm_source') ||
    params.has('utm_campaign') ||
    params.has('utm_medium') ||
    params.get('welcome') === '1'
  )
}
