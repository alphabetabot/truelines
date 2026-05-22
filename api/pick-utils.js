/** Shared helpers for picks storage, grading, display, and email */

export const MIN_EDGE_LENGTH = 80
export const MIN_FADE_EDGE_LENGTH = 60

export function parseAmericanOdds(oddsStr) {
  if (oddsStr == null || oddsStr === '') return null
  if (typeof oddsStr === 'number') return oddsStr
  const match = String(oddsStr).match(/([+-]?\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (Number.isNaN(n) || Math.abs(n) < 100) return null
  return n
}

export function formatAmericanOdds(odds) {
  const n = typeof odds === 'number' ? odds : parseAmericanOdds(odds)
  if (n == null) return ''
  return n > 0 ? `+${n}` : `${n}`
}

export function profitUnits(americanOdds, won) {
  const odds = typeof americanOdds === 'number' ? americanOdds : parseAmericanOdds(americanOdds)
  if (!odds) return won ? 1 : -1
  if (!won) return -1
  if (odds > 0) return odds / 100
  return 100 / Math.abs(odds)
}

export function formatConfidence(stars) {
  const n = Math.min(5, Math.max(1, stars || 3))
  return '★'.repeat(n)
}

export function extractMatchup(section) {
  const arrowMatch = section.match(/([A-Za-z0-9\s.'-]+?)\s+@\s+([A-Za-z0-9\s.'-]+?)\s*(?:→|->)/)
  if (arrowMatch) {
    return `${arrowMatch[1].trim()} @ ${arrowMatch[2].trim()}`
  }
  const atMatch = section.match(/(?:^|\n)\s*(?:[A-Z]{2,4}:?\s*)?([A-Za-z0-9\s.'-]+?)\s+@\s+([A-Za-z0-9\s.'-]+?)(?:\s|$|\n)/m)
  if (atMatch) {
    return `${atMatch[1].trim()} @ ${atMatch[2].trim()}`
  }
  return null
}

export function cleanPickHeadline(headline) {
  return headline
    .replace(/^FADE:\s*/i, '')
    .replace(/^(?:MLB|NBA|NHL|NFL)\s*(?:Pick)?:\s*/i, '')
    .trim()
}

export function formatBetDisplay({ betType, odds, bestBook, isFade }) {
  if (isFade) return 'FADE · DraftKings'
  const oddsStr = formatAmericanOdds(odds)
  const parts = [betType, oddsStr, bestBook || 'DraftKings'].filter(Boolean)
  return parts.join(' · ') || 'N/A'
}

export function extractSportFromPick(pickLine) {
  const clean = pickLine.replace(/^FADE:\s*/i, '')
  if (clean.toUpperCase().startsWith('MLB')) return 'MLB'
  if (clean.toUpperCase().startsWith('NBA')) return 'NBA'
  if (clean.toUpperCase().startsWith('NHL')) return 'NHL'
  if (clean.toUpperCase().startsWith('NFL')) return 'NFL'
  if (clean.toLowerCase().includes('baseball')) return 'MLB'
  if (clean.toLowerCase().includes('basketball')) return 'NBA'
  if (clean.toLowerCase().includes('hockey')) return 'NHL'
  if (clean.toLowerCase().includes('football')) return 'NFL'
  return 'Mixed'
}

function teamLast(name) {
  return (name || '').split(' ').pop().toLowerCase()
}

function textMatchesTeam(text, teamName) {
  const t = text.toLowerCase()
  return t.includes(teamName.toLowerCase()) || t.includes(teamLast(teamName))
}

/** Build DraftKings odds lookup from games with bookmakers */
export function buildOddsByMatchup(games) {
  const map = {}

  for (const g of games) {
    if (!g.away || !g.home) continue
    const key = `${g.away} @ ${g.home}`
    const dk = g.bookmakers?.find(b => b.key === 'draftkings')
    if (!dk) continue

    const entry = { sport: g.sport, away: g.away, home: g.home }

    const h2h = dk.markets?.find(m => m.key === 'h2h')
    if (h2h) {
      const awayOut = h2h.outcomes?.find(o => o.name === g.away)
      const homeOut = h2h.outcomes?.find(o => o.name === g.home)
      if (awayOut?.price != null) entry.awayML = awayOut.price
      if (homeOut?.price != null) entry.homeML = homeOut.price
    }

    const spreads = dk.markets?.find(m => m.key === 'spreads')
    if (spreads) {
      const awayOut = spreads.outcomes?.find(o => o.name === g.away)
      const homeOut = spreads.outcomes?.find(o => o.name === g.home)
      if (awayOut) {
        entry.awaySpreadLine = awayOut.point
        entry.awaySpreadOdds = awayOut.price
      }
      if (homeOut) {
        entry.homeSpreadLine = homeOut.point
        entry.homeSpreadOdds = homeOut.price
      }
    }

    const totals = dk.markets?.find(m => m.key === 'totals')
    if (totals) {
      const over = totals.outcomes?.find(o => o.name === 'Over')
      const under = totals.outcomes?.find(o => o.name === 'Under')
      if (over) {
        entry.totalLine = over.point
        entry.overOdds = over.price
      }
      if (under) entry.underOdds = under.price
    }

    map[key] = entry
  }

  return map
}

export function findOddsForGame(gameStr, oddsByMatchup) {
  if (!gameStr) return null
  if (oddsByMatchup[gameStr]) return oddsByMatchup[gameStr]

  const parts = gameStr.split('@').map(s => s.trim())
  if (parts.length < 2) return null

  for (const val of Object.values(oddsByMatchup)) {
    if (
      textMatchesTeam(parts[0], val.away) &&
      textMatchesTeam(parts[1], val.home)
    ) {
      return val
    }
  }
  return null
}

export function validatePickEdge(pick) {
  const edge = (pick.edge || '').trim()
  const min = pick.isFade ? MIN_FADE_EDGE_LENGTH : MIN_EDGE_LENGTH
  return edge.length >= min
}

/** Attach real DraftKings odds; returns null if non-fade pick has no DK line */
export function attachDraftKingsOdds(pick, oddsByMatchup) {
  const lines = findOddsForGame(pick.game, oddsByMatchup)
  if (!lines) return null

  pick.bestBook = 'DraftKings'

  if (pick.isFade) {
    return pick
  }

  const text = `${pick.pickSelection} ${pick.betType}`.toLowerCase()

  if (text.includes('ml') || text.includes('moneyline')) {
    if (textMatchesTeam(text, lines.away) && lines.awayML != null) {
      pick.odds = lines.awayML
      pick.betType = 'Moneyline'
    } else if (textMatchesTeam(text, lines.home) && lines.homeML != null) {
      pick.odds = lines.homeML
      pick.betType = 'Moneyline'
    } else {
      return null
    }
  } else if (text.includes('over')) {
    if (lines.overOdds == null) return null
    const lineMatch = text.match(/over\s+(\d+\.?\d*)/)
    const line = lineMatch ? lineMatch[1] : lines.totalLine
    pick.odds = lines.overOdds
    pick.betType = line != null ? `Over ${line}` : 'Over'
  } else if (text.includes('under')) {
    if (lines.underOdds == null) return null
    const lineMatch = text.match(/under\s+(\d+\.?\d*)/)
    const line = lineMatch ? lineMatch[1] : lines.totalLine
    pick.odds = lines.underOdds
    pick.betType = line != null ? `Under ${line}` : 'Under'
  } else {
    const spreadMatch = text.match(/([+-]\d+\.?\d*)/)
    if (spreadMatch) {
      if (textMatchesTeam(text, lines.away) && lines.awaySpreadOdds != null) {
        pick.odds = lines.awaySpreadOdds
        pick.betType = `Spread ${lines.awaySpreadLine > 0 ? '+' : ''}${lines.awaySpreadLine}`
      } else if (textMatchesTeam(text, lines.home) && lines.homeSpreadOdds != null) {
        pick.odds = lines.homeSpreadOdds
        pick.betType = `Spread ${lines.homeSpreadLine > 0 ? '+' : ''}${lines.homeSpreadLine}`
      } else {
        return null
      }
    } else if (textMatchesTeam(text, lines.away) && lines.awayML != null) {
      pick.odds = lines.awayML
      pick.betType = 'Moneyline'
    } else if (textMatchesTeam(text, lines.home) && lines.homeML != null) {
      pick.odds = lines.homeML
      pick.betType = 'Moneyline'
    } else {
      return null
    }
  }

  const oddsNum = typeof pick.odds === 'number' ? pick.odds : parseAmericanOdds(pick.odds)
  if (oddsNum == null || Math.abs(oddsNum) < 100) return null
  pick.odds = oddsNum

  return pick
}

export function preparePicksForStore(rawPicks, oddsByMatchup) {
  const valid = []

  for (const pick of rawPicks) {
    if (!validatePickEdge(pick)) {
      console.warn(`Skip pick (edge < ${pick.isFade ? MIN_FADE_EDGE_LENGTH : MIN_EDGE_LENGTH} chars):`, pick.pickSelection)
      continue
    }

    const attached = attachDraftKingsOdds({ ...pick }, oddsByMatchup)
    if (!attached) {
      console.warn('Skip pick (no DraftKings line):', pick.game, pick.pickSelection)
      continue
    }

    valid.push(attached)
  }

  return valid
}

const PICK_LABELS = ['TOP PICK OF THE DAY', 'PICK #2', 'PICK #3', 'FADE OF THE DAY']

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Email HTML from stored daily_picks rows (same shape as /api/todays-pick?all=1) */
export function buildEmailFromPicks(storedRows, date) {
  const blocks = storedRows.map((row, i) => {
    const isFade = (row.pick || '').toLowerCase().includes('fade') || (row.bet || '').toLowerCase().includes('fade')
    const label = PICK_LABELS[i] || `PICK #${i + 1}`
    const titleColor = isFade ? '#ef4444' : '#f59e0b'
    const reasonLabel = isFade ? 'Why fade' : 'Edge'
    const reason = escapeHtml(row.edge || '')

    return `
      <p style="font-weight:900;font-size:16px;color:${titleColor};margin:20px 0 6px;">${escapeHtml(label)}</p>
      <div style="background:#f1f5f9;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin:8px 0;">
        <p style="margin:0 0 4px;font-size:14px;color:#0f172a;font-weight:600;">${escapeHtml(row.game || '')}</p>
        <p style="margin:0 0 6px;font-size:15px;color:#f59e0b;font-weight:700;">${escapeHtml(row.pick || '')}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#475569;">${escapeHtml(row.bet || '')} · ${escapeHtml(row.confidence || '')}</p>
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.5;"><strong>${reasonLabel}:</strong> ${reason}</p>
      </div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">TrueOdds<span style="color:#f59e0b;">IQ</span></h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Daily AI Picks | ${escapeHtml(date)} | MLB | NBA | NHL</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.6;">
      <strong>Odds from DraftKings as of ${escapeHtml(date)}:</strong> Picks below match trueoddsiq.com exactly. Shop other books for better lines. AI-generated for informational purposes only. Always bet responsibly. Must be 21+.
    </div>
    ${blocks}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://trueoddsiq.com/picks" style="background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block;">View Full Analysis and Live Odds</a>
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:0 0 16px 16px;padding:14px;text-align:center;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0;color:#94a3b8;font-size:11px;">TrueOddsIQ | trueoddsiq.com | Must be 21+ | Gambling problem? <a href="tel:18004264537" style="color:#16a34a;">1-800-GAMBLER</a></p>
    <p style="margin:4px 0 0;"><a href="https://trueoddsiq.com/unsubscribe" style="color:#94a3b8;font-size:11px;">Unsubscribe</a></p>
  </div>
</div></body></html>`
}

export function formatTopPickSocial(topRow, date) {
  const pickLine = topRow.pick || ''
  const betLine = topRow.bet || ''
  const edgeLine = topRow.edge || ''
  return { pickLine, betLine, edgeLine, hasPicks: Boolean(pickLine && betLine && edgeLine) }
}
