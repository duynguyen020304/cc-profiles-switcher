import React from 'react'
import type { Profile } from '../types/profile'
import ModelMappingRow from './ModelMappingRow'

interface ActiveProfileDetailProps {
  profile: Profile | null
}

const ActiveProfileDetail: React.FC<ActiveProfileDetailProps> = ({ profile }) => {
  return (
    <div
      data-testid="active-profile-detail"
      style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: '#0a0a0a',
        flexShrink: 0
      }}
    >
      {profile ? (
        <>
          <div
            data-testid="active-profile-name"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#f97316',
              marginBottom: 10
            }}
          >
            ▸ {profile.displayName}
          </div>

          <ModelMappingRow label="Haiku" value={profile.modelHaiku} testId="model-row-haiku" />
          <ModelMappingRow label="Sonnet" value={profile.modelSonnet} testId="model-row-sonnet" />
          <ModelMappingRow label="Opus" value={profile.modelOpus} testId="model-row-opus" />
          <ModelMappingRow label="Base URL" value={profile.baseUrl} testId="model-row-base-url" />
        </>
      ) : (
        <div
          data-testid="no-active-profile-message"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.78rem',
            color: '#555',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '10px 0'
          }}
        >
          No profile active — using default settings.json
        </div>
      )}
    </div>
  )
}

export default ActiveProfileDetail
