<!-- Parent: ../AGENTS.md -->

# components - React UI Components

React UI components for the profile switcher widget. All components use TypeScript interfaces for props and include `data-testid` attributes for testing.

## Component Overview

| Component | Purpose | Props Interface |
|-----------|---------|-----------------|
| `TopBar.tsx` | Window title bar with controls | `TopBarProps` |
| `ProfileList.tsx` | Scrollable list of profile cards | `ProfileListProps` |
| `ProfileCard.tsx` | Individual profile item with switch button | `ProfileCardProps` |
| `ActiveProfileDetail.tsx` | Detailed view of active profile model mappings | `ActiveProfileDetailProps` |
| `ModelMappingRow.tsx` | Reusable row for displaying model config | `ModelMappingRowProps` |

## Component Details

### TopBar

Window title bar with app icon, title, and window controls.

**Props:**
- `onRefresh: () => void` - Callback for refresh button click
- `onMinimize: () => void` - Callback for minimize button click
- `onClose: () => void` - Callback for close button click

**Test IDs:**
- `top-bar` - Container div
- `refresh-button` - Refresh action button

### ProfileList

Container component that renders a scrollable list of ProfileCard components. Shows empty state message when no profiles exist.

**Props:**
- `profiles: Profile[]` - Array of profile objects to display
- `activeProfileId: string | null` - ID of currently active profile
- `switchingId: string | null` - ID of profile currently being switched
- `switchErrors: Record<string, string | null>` - Error messages per profile ID
- `onSwitch: (profileId: string) => void` - Callback to switch to a profile

**Test IDs:**
- `profile-list` - Container div

### ProfileCard

Individual profile card with active indicator, profile info, and switch button. Supports keyboard navigation (Enter/Space to switch).

**Props:**
- `profile: Profile` - Profile data object
- `isActive: boolean` - Whether this profile is currently active
- `isSwitching: boolean` - Whether a switch operation is in progress
- `switchError: string | null` - Error message if switch failed
- `onSwitch: (profileId: string) => void` - Callback to switch to this profile

**Test IDs:**
- `profile-card-{id}` - Container div (e.g., `profile-card-work`)
- `profile-card-{id}-active-dot` - Active status indicator
- `profile-card-{id}-base-url` - Base URL display
- `profile-card-{id}-switch` - Switch button
- `switch-spinner-{id}` - Loading spinner during switch
- `switch-error-{id}` - Error message display

### ActiveProfileDetail

Panel showing the active profile's model mappings. Displays fallback message when no profile is active.

**Props:**
- `profile: Profile | null` - Active profile or null if using default settings

**Test IDs:**
- `active-profile-detail` - Container div
- `active-profile-name` - Profile name header
- `model-row-haiku` - Haiku model mapping row
- `model-row-sonnet` - Sonnet model mapping row
- `model-row-opus` - Opus model mapping row
- `model-row-base-url` - Base URL row
- `no-active-profile-message` - Fallback message when no profile active

### ModelMappingRow

Reusable row component for displaying a label-value pair. Used by ActiveProfileDetail for model mappings.

**Props:**
- `label: string` - Label text (displayed uppercase)
- `value: string | null` - Value to display, shows "—" if null
- `testId: string` - data-testid for the row

## AI Agent Instructions

When modifying components in this directory:

1. **Use TypeScript interfaces** - Define props interfaces at the top of each file
2. **Add data-testid attributes** - Every interactive element needs a test ID for E2E testing
3. **Import types from `../types/profile`** - Use shared Profile type, don't redefine
4. **Keep styling inline** - Components use inline styles with JetBrains Mono font family
5. **Support keyboard navigation** - Interactive elements should handle Enter/Space keys
6. **Use hooks from `../hooks/`** - Never access `window.ccProfiles` directly in components

### Adding New Component

1. Create file in `src/renderer/components/`
2. Define TypeScript interface for props
3. Add `data-testid` to root element and interactive children
4. Import Profile type from `../types/profile` if needed
5. Use hooks from `../hooks/` for API calls
6. Export as default

### Component Styling Convention

All components use inline styles with:
- Font: `'JetBrains Mono', 'Fira Code', Consolas, monospace`
- Colors: Dark theme (`#111111` background, `#e5e5e5` text, `#f97316` accent)
- Transitions: `0.15s ease` for hover effects
- No external CSS files - styles are self-contained

### Test ID Naming Convention

Pattern: `{component-name}-{element}-{optional-id}`

Examples:
- `top-bar` (component container)
- `profile-card-work` (component with ID)
- `profile-card-work-switch` (element within component with ID)
- `model-row-haiku` (specific row type)