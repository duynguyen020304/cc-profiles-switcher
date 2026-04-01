import React, { useState } from 'react'
import type { Profile } from '../types/profile'

interface ProfileCardProps {
  profile: Profile
  isActive: boolean
  isSwitching: boolean
  switchError: string | null
  onSwitch: (profileId: string) => void
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isActive,
  isSwitching,
  switchError,
  onSwitch
}) => {
  return (
    <div
      data-testid={`profile-card-${profile.id}`}
      onClick={() => !isActive && !isSwitching && onSwitch(profile.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isActive && !isSwitching) {
          onSwitch(profile.id)
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        margin: '4px 8px',
        borderRadius: 8,
        borderLeft: `3px solid ${isActive ? '#f97316' : 'transparent'}`,
        backgroundColor: isActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255,255,255,0.02)',
        cursor: isSwitching ? 'not-allowed' : isActive ? 'default' : 'pointer',
        transition: 'all 0.15s ease',
        borderRight: '1px solid transparent',
        borderTop: '1px solid transparent',
        borderBottom: '1px solid transparent'
      }}
    >
      {/* Active indicator dot */}
      <span
        data-testid={`profile-card-${profile.id}-active-dot`}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isActive ? '#22c55e' : '#333',
          flexShrink: 0,
          boxShadow: isActive ? '0 0 6px rgba(34,197,94,0.5)' : 'none'
        }}
      />

      {/* Profile info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.85rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f97316' : '#d4d4d4',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {profile.displayName}
        </div>
        <div
          data-testid={`profile-card-${profile.id}-base-url`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.72rem',
            color: '#666',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {profile.baseUrl || 'No base URL'}
        </div>
      </div>

      {/* Switch area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        {isSwitching ? (
          <div data-testid={`switch-spinner-${profile.id}`} style={{ padding: '2px 8px' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" transform="rotate(90 12 12)" style={{ animation: 'spin 0.8s linear infinite' }} />
              Sorry, SVG animation requires CSS. Using a simpler spinner:
            </svg>
            <span style={{ color: '#666', fontSize: '0.75rem' }}>⏳</span>
          </div>
        ) : isActive ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.68rem',
              color: '#22c55e',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Active
          </span>
        ) : (
          <button
            data-testid={`profile-card-${profile.id}-switch`}
            onClick={(e) => {
              e.stopPropagation()
              onSwitch(profile.id)
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '3px 10px',
              color: '#aaa',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.68rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLElement).style.borderColor = '#f97316'
              ;(e.target as HTMLElement).style.color = '#f97316'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
              ;(e.target as HTMLElement).style.color = '#aaa'
            }}
          >
            Switch
          </button>
        )}
        {switchError && (
          <div
            data-testid={`switch-error-${profile.id}`}
            style={{
              marginTop: 4,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.65rem',
              color: '#ef4444',
              textAlign: 'center',
              maxWidth: 120
            }}
          >
            {switchError}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileCard
