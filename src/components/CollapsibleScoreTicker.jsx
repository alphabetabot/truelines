import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ScoreTicker from './ScoreTicker'

function defaultExpanded() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 640px)').matches
}

/** Collapsed by default on mobile; optional expand. Fetches scores only when open. */
export default function CollapsibleScoreTicker() {
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const onChange = () => {
      if (mq.matches) setExpanded(true)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--bg-elevated)' }}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4"
        style={{ height: 32, color: 'rgba(255,255,255,0.85)' }}
        aria-expanded={expanded}
      >
        <span className="text-xs font-bold tracking-wide">Scores</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && <ScoreTicker embedded />}
    </div>
  )
}
