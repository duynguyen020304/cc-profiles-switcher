import React from 'react'
import type { UpdateStatus } from '../types/profile'

interface TopBarProps {
  onRefresh: () => void
  onMinimize: () => void
  onClose: () => void
  // Update props
  updateStatus?: UpdateStatus
  appVersion?: string
  onUpdateCheck?: () => void
  onInstallUpdate?: () => void
}

// Spinner component for loading state
const Spinner: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
  </svg>
)

// Update status indicator component
const UpdateIndicator: React.FC<{
  status: UpdateStatus
  appVersion: string
  onCheck: () => void
  onInstall: () => void
}> = ({ status, appVersion, onCheck, onInstall }) => {
  const isChecking = status.state === 'checking'
  const isDownloading = status.state === 'downloading'
  const isDownloaded = status.state === 'downloaded'
  const isAvailable = status.state === 'available'
  const hasError = status.state === 'error'
  const notAvailable = status.state === 'not-available'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {/* Check for update button */}
      <button
        onClick={onCheck}
        disabled={isChecking || isDownloading}
        title={`Check for updates (v${appVersion})`}
        style={{
          background: 'none',
          border: 'none',
          cursor: isChecking || isDownloading ? 'wait' : 'pointer',
          padding: '4px 6px',
          borderRadius: 4,
          color: hasError ? '#ef4444' : '#888',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease',
          WebkitAppRegion: 'no-drag' as const,
          opacity: isChecking || isDownloading ? 0.7 : 1
        }}
        onMouseEnter={(e) => { if (!isChecking && !isDownloading) e.currentTarget.style.color = '#f97316' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = hasError ? '#ef4444' : '#888' }}
      >
        {isChecking ? (
          <Spinner size={14} />
        ) : (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        )}
      </button>

      {/* Download progress indicator */}
      {isDownloading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: '#888',
            minWidth: 60
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              backgroundColor: '#333',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${status.percent}%`,
                height: '100%',
                backgroundColor: '#f97316',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
          <span>{Math.round(status.percent)}%</span>
        </div>
      )}

      {/* Update available/downloaded badge */}
      {(isAvailable || isDownloaded) && (
        <button
          onClick={isDownloaded ? onInstall : onCheck}
          title={isDownloaded ? `Install version ${status.version}` : `Version ${status.version} available`}
          style={{
            background: '#f97316',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            WebkitAppRegion: 'no-drag' as const
          }}
        >
          {isDownloaded ? (
            <>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12l5 5L20 7" />
              </svg>
              Install
            </>
          ) : (
            <>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14m-7-7l7 7 7-7" />
              </svg>
              {status.version}
            </>
          )}
        </button>
      )}

      {/* Error indicator */}
      {hasError && (
        <span
          title={status.message}
          style={{
            fontSize: 11,
            color: '#ef4444',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Error
        </span>
      )}
    </div>
  )
}

const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  onMinimize,
  onClose,
  updateStatus,
  appVersion = 'unknown',
  onUpdateCheck,
  onInstallUpdate
}) => {
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
        {/* Update indicator */}
        {updateStatus && onUpdateCheck && onInstallUpdate && (
          <UpdateIndicator
            status={updateStatus}
            appVersion={appVersion}
            onCheck={onUpdateCheck}
            onInstall={onInstallUpdate}
          />
        )}

        {/* Refresh button */}
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

        {/* Minimize button */}
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

        {/* Close button */}
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
