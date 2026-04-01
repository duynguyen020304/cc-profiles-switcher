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

export interface CCProfilesAPI {
  getProfiles: () => Promise<Profile[]>
  getActiveProfile: () => Promise<Profile | null>
  switchProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>
  refreshProfiles: () => Promise<Profile[]>
  getSwitchHistory: () => Promise<SwitchHistoryEntry[]>
  onProfileSwitched: (cb: (profile: Profile) => void) => () => void
  onProfilesChanged: (cb: (profiles: Profile[]) => void) => () => void
}

declare global {
  interface Window {
    ccProfiles: CCProfilesAPI
  }
}
export {}
