import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { fetchSubscriptionStatus } from '../lib/billingApi'

const DEFAULT_STATUS = {
  loading: true,
  isPremium: false,
  status: 'inactive',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  priceDisplay: '$19.95/mo',
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState(DEFAULT_STATUS)

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription({ ...DEFAULT_STATUS, loading: false })
      return
    }

    setSubscription({
      ...DEFAULT_STATUS,
      loading: true,
      isPremium: false,
    })
    try {
      const data = await fetchSubscriptionStatus()
      setSubscription({
        loading: false,
        isPremium: Boolean(data.isPremium),
        status: data.status || 'inactive',
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        priceDisplay: data.priceDisplay || '$19.95/mo',
      })
    } catch {
      setSubscription({ ...DEFAULT_STATUS, loading: false })
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return undefined
    let cancelled = false

    async function load() {
      if (!user) {
        if (!cancelled) setSubscription({ ...DEFAULT_STATUS, loading: false })
        return
      }

      if (!cancelled) {
        setSubscription({
          ...DEFAULT_STATUS,
          loading: true,
          isPremium: false,
        })
      }
      try {
        const data = await fetchSubscriptionStatus()
        if (!cancelled) {
          setSubscription({
            loading: false,
            isPremium: Boolean(data.isPremium),
            status: data.status || 'inactive',
            currentPeriodEnd: data.currentPeriodEnd || null,
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
            priceDisplay: data.priceDisplay || '$19.95/mo',
          })
        }
      } catch {
        if (!cancelled) setSubscription({ ...DEFAULT_STATUS, loading: false })
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id, authLoading])

  return { ...subscription, refresh }
}
