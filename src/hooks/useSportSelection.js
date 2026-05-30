import { useState, useCallback } from 'react'
import { getInitialSport, setStoredSport } from '../lib/defaultSport'
import { trackSportSelect } from '../lib/analytics'

/**
 * Sport state with localStorage persistence.
 * First visit uses seasonal default; returning users get last selection.
 */
export function useSportSelection(page = 'unknown') {
  const [sport, setSportState] = useState(getInitialSport)

  const setSport = useCallback((sportKey, source = 'manual') => {
    setSportState(sportKey)
    setStoredSport(sportKey)
    trackSportSelect(sportKey, page, source)
  }, [page])

  return [sport, setSport]
}
