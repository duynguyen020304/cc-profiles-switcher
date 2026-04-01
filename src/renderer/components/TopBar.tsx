import React from 'react'

interface TopBarProps {
  onRefresh: () => void
  onMinimize: () => void
  onClose: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onRefresh, onMinimize, onClose }) => {
  return (
    <div
      className="top-bar"
      data-testid="top-bar"
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: '#111111',
        userSelect: 'none',
        WebkitAppRegion: 'drag' as const,
        flexShrink: 0
      }}
    >
      {/* Left: Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M15 9l-6 6m0-6l6 6" />
        </svg>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: 13,
            fontWeight: 600,
            color: '#e5e5e5',
            letterSpacing: '-0.01em'
          }}
        >
          CC Profiles
        </span>
      </div>

      {/* Right: Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onRefresh}
          data-testid="refresh-button"
          title="Refresh profiles"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 4,
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
            WebkitAppRegion: 'no-drag' as const
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f97316' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
        <button
          onClick={onMinimize}
          title="Minimize"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 7px',
            borderRadius: 4,
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitAppRegion: 'no-drag' as const
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ccc' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={onClose}
          title="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 7px',
            borderRadius: 4,
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitAppRegion: 'no-drag' as const
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#888' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TopBar
