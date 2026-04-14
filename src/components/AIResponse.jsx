import { Brain, Loader2, AlertCircle } from 'lucide-react'

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e6edf3">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#7d8590">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(56,139,253,0.12);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.85em;color:#79c0ff">$1</code>')
    .replace(/★/g, '<span style="color:#d29922">★</span>')
    .replace(/☆/g, '<span style="color:#30363d">☆</span>')
}

function MarkdownText({ text }) {
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="text-xs font-bold mt-3" style={{ color: 'var(--gold)' }}>{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="text-sm font-bold mt-4" style={{ color: 'var(--accent)' }}>{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="text-base font-bold mt-4" style={{ color: 'var(--text-primary)' }}>{line.slice(2)}</h2>
        if (line.startsWith('**') && line.endsWith('**'))
          return <p key={i} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{line.slice(2, -2)}</p>
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)', marginTop: 2 }}>·</span>
              <span className="text-xs" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
            </div>
          )
        if (line === '' || line === '---') return <div key={i} style={{ height: 4 }} />
        return (
          <p key={i} className="text-xs" style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        )
      })}
    </div>
  )
}

export default function AIResponse({ loading, error, data, label = 'AI Analysis', provider = 'Claude' }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <Brain size={14} style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{label}</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded"
          style={{ background: provider === 'ChatGPT' ? 'rgba(22,163,74,0.1)' : 'var(--accent-dim)', color: provider === 'ChatGPT' ? '#16a34a' : 'var(--accent)', border: provider === 'ChatGPT' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(56,139,253,0.3)', fontSize: 10 }}>
          {provider}
        </span>
      </div>
      <div className="p-4" style={{ background: 'var(--bg-card)' }}>
        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Analyzing with {provider}...</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded"
            style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,81,73,0.25)' }}>
            <AlertCircle size={14} style={{ color: 'var(--red)' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Analysis failed</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          </div>
        )}
        {!loading && !error && data && <MarkdownText text={data} />}
        {!loading && !error && !data && (
          <p className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>
            Select a game to generate analysis
          </p>
        )}
      </div>
    </div>
  )
}
