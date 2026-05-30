import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatLiveStatusBadge,
  gameStatusKey,
  lookupLiveStatus,
} from './liveGameStatus.js'

describe('liveGameStatus', () => {
  it('gameStatusKey normalizes team names', () => {
    assert.equal(
      gameStatusKey('Detroit Tigers', 'Chicago White Sox'),
      gameStatusKey('detroit tigers', 'chicago white sox'),
    )
  })

  it('lookupLiveStatus matches full names to nickname keys', () => {
    const map = { [gameStatusKey('Tigers', 'White Sox')]: 'Bot 3rd' }
    assert.equal(
      lookupLiveStatus({ away_team: 'Detroit Tigers', home_team: 'Chicago White Sox' }, map),
      'Bot 3rd',
    )
  })

  it('formatLiveStatusBadge shows inning detail when live', () => {
    const badge = formatLiveStatusBadge({
      isFinal: false,
      isLive: true,
      gameTime: new Date(),
      liveDetail: 'Top 4th',
    })
    assert.equal(badge.label, '● Top 4th')
  })

  it('formatLiveStatusBadge falls back to LIVE', () => {
    const badge = formatLiveStatusBadge({
      isFinal: false,
      isLive: true,
      gameTime: new Date(),
      liveDetail: null,
    })
    assert.equal(badge.label, '● LIVE')
  })
})
