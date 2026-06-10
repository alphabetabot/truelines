/** Pacific calendar date (YYYY-MM-DD) — matches newsletter slate and site “today”. */
export function pacificDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}
