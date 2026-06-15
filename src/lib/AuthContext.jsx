import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

/** Sign out after this many ms without pointer/keyboard/scroll activity. */
export const INACTIVITY_SIGN_OUT_MS = 10 * 60 * 1000

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimerRef = useRef(null)

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  const scheduleInactivitySignOut = useCallback(() => {
    clearInactivityTimer()
    inactivityTimerRef.current = setTimeout(() => {
      signOut()
    }, INACTIVITY_SIGN_OUT_MS)
  }, [clearInactivityTimer, signOut])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      clearInactivityTimer()
      return undefined
    }

    const onActivity = () => scheduleInactivitySignOut()

    scheduleInactivitySignOut()
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity, { passive: true }))

    return () => {
      clearInactivityTimer()
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
    }
  }, [user, clearInactivityTimer, scheduleInactivitySignOut])

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
