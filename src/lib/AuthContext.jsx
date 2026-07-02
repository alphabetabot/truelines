import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import {
  ACTIVITY_EVENTS,
  ACTIVITY_THROTTLE_MS,
  INACTIVITY_CHECK_INTERVAL_MS,
  INACTIVITY_SIGN_OUT_MS,
  isIdleExpired,
  mergeAuthUser,
} from './authInactivity'

const AuthContext = createContext(null)

export { INACTIVITY_SIGN_OUT_MS }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const lastActivityAtRef = useRef(0)
  const userId = user?.id ?? null

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  const recordActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now()
  }, [])

  const checkIdleSignOut = useCallback(() => {
    if (!userId) return
    if (isIdleExpired(lastActivityAtRef.current)) {
      signOut()
    }
  }, [signOut, userId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(prev => mergeAuthUser(prev, session))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prev => mergeAuthUser(prev, session))
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      lastActivityAtRef.current = 0
      return undefined
    }

    recordActivity()

    let lastBump = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastBump < ACTIVITY_THROTTLE_MS) return
      lastBump = now
      recordActivity()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdleSignOut()
      }
    }

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    const interval = window.setInterval(checkIdleSignOut, INACTIVITY_CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [userId, recordActivity, checkIdleSignOut])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
export function useAuth() {
  return useContext(AuthContext)
}
