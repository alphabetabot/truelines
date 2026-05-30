import { useQuery } from '@tanstack/react-query'
import { fetchLiveStatusMapForSport } from '../lib/liveGameStatus'

const POLL_MS = 30_000

export function useLiveStatusMap(sportKey, enabled = true) {
  return useQuery({
    queryKey: ['live-game-status', sportKey],
    queryFn: () => fetchLiveStatusMapForSport(sportKey),
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    enabled: Boolean(sportKey) && enabled,
  })
}
