import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'

/** True at lg+ (1024px). Mobile layout is the default for phones and small tablets. */
export function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(DESKTOP_QUERY).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
