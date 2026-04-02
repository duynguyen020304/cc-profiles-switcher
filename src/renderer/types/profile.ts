export interface Profile {
  id: string
  filename: string
  displayName: string
  baseUrl: string | null
  authTokenHint: string | null
  modelHaiku: string | null
  modelSonnet: string | null
  modelOpus: string | null
  rawJson: string
  lastSeen: number
  createdAt: number
}

export interface SwitchHistoryEntry {
  id: number
  fromProfileId: string | null
  toProfileId: string
  switchedAt: number
  success: number
}

// Update status type for UI display
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string; releaseDate?: string }
  | { state: 'not-available'; currentVersion: string }
  | { state: 'downloading'; percent: number; transferred: number; total: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export interface CCProfilesAPI {
  getProfiles: () => Promise<Profile[]>
  getActiveProfile: () => Promise<Profile | null>
  switchProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>
  refreshProfiles: () => Promise<Profile[]>
  getSwitchHistory: () => Promise<SwitchHistoryEntry[]>
  onProfileSwitched: (cb: (profile: Profile) => void) => () => void
  onProfilesChanged: (cb: (profiles: Profile[]) => void) => () => void
  // Update API
  getAppVersion: () => Promise<string>
  getUpdateStatus: () => Promise<UpdateStatus>
  checkForUpdates: () => Promise<void>
  installUpdate: () => void
  onUpdateStatusChanged: (cb: (status: UpdateStatus) => void) => () => void
}

declare global {
  interface Window {
    ccProfiles: CCProfilesAPI
  }
}
export {}
