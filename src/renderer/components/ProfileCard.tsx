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
        gap: 6,
        padding: '6px 8px',
        margin: '2px 4px',
        borderRadius: 6,
        borderLeft: `2px solid ${isActive ? '#f97316' : 'transparent'}`,
        backgroundColor: isActive ? 'rgba(249, 115, 22, 0.06)' : 'rgba(255,255,255,0.01)',
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
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isActive ? '#22c55e' : '#333',
          flexShrink: 0,
          boxShadow: isActive ? '0 0 4px rgba(34,197,94,0.5)' : 'none'
        }}
      />

      {/* Profile info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.78rem',
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
            fontSize: '0.65rem',
            color: '#666',
            marginTop: 1,
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
          <div data-testid={`switch-spinner-${profile.id}`} style={{ padding: '1px 4px' }}>
            <span style={{ color: '#666', fontSize: '0.65rem' }}>⏳</span>
          </div>
        ) : isActive ? (
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.6rem',
              color: '#22c55e',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
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
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              padding: '2px 6px',
              color: '#aaa',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.6rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLElement).style.borderColor = '#f97316'
              ;(e.target as HTMLElement).style.color = '#f97316'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
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
              marginTop: 2,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.58rem',
              color: '#ef4444',
              textAlign: 'center',
              maxWidth: 100
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
