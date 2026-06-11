import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getSeasonalDefaultSport } from './defaultSport.js'

describe('getSeasonalDefaultSport', () => {
  it('defaults to World Cup during 2026 tournament', () => {
    assert.equal(getSeasonalDefaultSport(new Date('2026-06-15')), 'soccer_fifa_world_cup')
    assert.equal(getSeasonalDefaultSport(new Date('2026-07-15')), 'soccer_fifa_world_cup')
  })

  it('defaults to MLB in summer outside World Cup', () => {
    assert.equal(getSeasonalDefaultSport(new Date('2026-08-01')), 'baseball_mlb')
  })

  it('defaults to NFL in September', () => {
    assert.equal(getSeasonalDefaultSport(new Date('2026-09-20')), 'americanfootball_nfl')
  })

  it('defaults to NCAAB during March Madness window', () => {
    assert.equal(getSeasonalDefaultSport(new Date('2026-03-20')), 'basketball_ncaab')
  })

})
