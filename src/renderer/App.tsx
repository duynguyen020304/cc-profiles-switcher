import React, { useState } from 'react'
import TopBar from './components/TopBar'
import ProfileList from './components/ProfileList'
import ActiveProfileDetail from './components/ActiveProfileDetail'
import { useProfiles } from './hooks/useProfiles'
import { useActiveProfile } from './hooks/useActiveProfile'
import { useUpdateStatus } from './hooks/useUpdateStatus'
import './styles/globals.css'

const App: React.FC = () => {
  const { profiles, loading, refresh } = useProfiles()
  const { activeProfile, switchingId, switchErrors, switchToProfile } = useActiveProfile(profiles)
  const { status: updateStatus, appVersion, checkForUpdates, installUpdate } = useUpdateStatus()

  const handleMinimize = (): void => {
    // Use IPC or electron API to minimize
    // For now, we'll rely on the main process handling this
    window.close() // In a real app, this would call minimize via IPC
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0d0d0d',
        color: '#e5e5e5',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        overflow: 'hidden',
        fontSize: 14
      }}
    >
      <TopBar
        onRefresh={refresh}
        onMinimize={handleMinimize}
        onClose={() => window.close()}
        updateStatus={updateStatus}
        appVersion={appVersion}
        onUpdateCheck={checkForUpdates}
        onInstallUpdate={installUpdate}
      />

      {loading && profiles.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            Scanning for profiles...
          </div>
        </div>
      ) : (
        <ProfileList
          profiles={profiles}
          activeProfileId={activeProfile?.id ?? null}
          switchingId={switchingId}
          switchErrors={switchErrors}
          onSwitch={switchToProfile}
        />
      )}

      <ActiveProfileDetail profile={activeProfile} />
    </div>
  )
}

export default App
