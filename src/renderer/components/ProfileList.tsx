import React from 'react'
import type { Profile } from '../types/profile'
import ProfileCard from './ProfileCard'

interface ProfileListProps {
  profiles: Profile[]
  activeProfileId: string | null
  switchingId: string | null
  switchErrors: Record<string, string | null>
  onSwitch: (profileId: string) => void
}

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  activeProfileId,
  switchingId,
  switchErrors,
  onSwitch
}) => {
  if (profiles.length === 0) {
    return (
      <div
        data-testid="profile-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.72rem',
            color: '#555',
            textAlign: 'center'
          }}
        >
          No profiles found in ~/.claude/
          <br />
          Add settings_*.json files to get started.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="profile-list"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent'
      }}
    >
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          isActive={profile.id === activeProfileId}
          isSwitching={profile.id === switchingId}
          switchError={switchErrors[profile.id] ?? null}
          onSwitch={onSwitch}
        />
      ))}
    </div>
  )
}

export default ProfileList
