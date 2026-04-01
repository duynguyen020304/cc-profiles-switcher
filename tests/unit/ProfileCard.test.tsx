import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ProfileCard from '@/renderer/components/ProfileCard'
import type { Profile } from '@/renderer/types/profile'

const mockProfile: Profile = {
  id: 'test-profile-1',
  filename: 'settings_test.json',
  displayName: 'Test Profile',
  baseUrl: 'https://test-api.example.com',
  authTokenHint: 'sk-test12...',
  modelHaiku: 'test-haiku',
  modelSonnet: 'test-sonnet',
  modelOpus: 'test-opus',
  rawJson: '{}',
  lastSeen: Date.now(),
  createdAt: Date.now()
}

describe('ProfileCard', () => {
  it('renders display name and base URL', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={false}
        isSwitching={false}
        switchError={null}
        onSwitch={vi.fn()}
      />
    )

    expect(screen.getByTestId('profile-card-test-profile-1')).toBeInTheDocument()
    expect(screen.getByText('Test Profile')).toBeInTheDocument()
    expect(screen.getByTestId('profile-card-test-profile-1-base-url')).toHaveTextContent('test-api.example.com')
  })

  it('shows active indicator dot when isActive=true', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={true}
        isSwitching={false}
        switchError={null}
        onSwitch={vi.fn()}
      />
    )

    const activeDot = screen.getByTestId(`profile-card-${mockProfile.id}-active-dot`)
    expect(activeDot).toBeInTheDocument()
  })

  it('calls onSwitch when clicked', () => {
    const handleSwitch = vi.fn()
    
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={false}
        isSwitching={false}
        switchError={null}
        onSwitch={handleSwitch}
      />
    )

    fireEvent.click(screen.getByTestId(`profile-card-${mockProfile.id}`))
    expect(handleSwitch).toHaveBeenCalledWith(mockProfile.id)
  })

  it('shows spinner during async switch', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={false}
        isSwitching={true}
        switchError={null}
        onSwitch={vi.fn()}
      />
    )

    expect(screen.getByTestId(`switch-spinner-${mockProfile.id}`)).toBeInTheDocument()
  })

  it('shows error message when switchError is provided', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={false}
        isSwitching={false}
        switchError={'Failed to switch profile'}
        onSwitch={vi.fn()}
      />
    )

    expect(screen.getByTestId(`switch-error-${mockProfile.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`switch-error-${mockProfile.id}`)).toHaveTextContent('Failed to switch profile')
  })

  it('does not call onSwitch when already active', () => {
    const handleSwitch = vi.fn()
    
    render(
      <ProfileCard
        profile={mockProfile}
        isActive={true}
        isSwitching={false}
        switchError={null}
        onSwitch={handleSwitch}
      />
    )

    fireEvent.click(screen.getByTestId(`profile-card-${mockProfile.id}`))
    expect(handleSwitch).not.toHaveBeenCalled()
  })

  it('shows "No base URL" when base URL is missing', () => {
    const profileWithoutUrl: Profile = {
      ...mockProfile,
      baseUrl: null
    }
    
    render(
      <ProfileCard
        profile={profileWithoutUrl}
        isActive={false}
        isSwitching={false}
        switchError={null}
        onSwitch={vi.fn()}
      />
    )

    expect(screen.getByTestId(`profile-card-${mockProfile.id}-base-url`)).toHaveTextContent('No base URL')
  })
})
