/**
 * CC Profiles — Playwright MCP E2E Test Specifications
 * 
 * These tests are NOT executed by @playwright/test or any npm package.
 * Instead, they are driven through Playwright MCP tool calls against
 * a running Electron window titled "CC Profiles".
 * 
 * Prerequisites:
 * 1. `npm run build` completed successfully
 * 2. App launched with CLAUDE_DIR_OVERRIDE pointing to tests/e2e/fixtures/
 * 3. Electron window is visible with title "CC Profiles"
 */

export const e2eTestSpecs = [
  {
    id: 'test-1',
    name: 'App launches and renders profile list',
    steps: [
      'Connect Playwright MCP to the running Electron window titled "CC Profiles"',
      'Assert data-testid="profile-list" is visible',
      'Assert at least 2 profile cards are present (data-testid matching profile-card-*)',
      'Assert data-testid="active-profile-detail" is visible'
    ]
  },
  {
    id: 'test-2', 
    name: 'Profile cards display correct metadata',
    steps: [
      'Assert data-testid="profile-card-fixture_alpha-base-url" contains text "alpha.example.com"',
      'Assert data-testid="profile-card-fixture_beta-base-url" contains text "beta.example.com"'
    ]
  },
  {
    id: 'test-3',
    name: 'Switch profile updates active state',
    steps: [
      'Click data-testid="profile-card-fixture_alpha-switch"',
      'Wait for data-testid="switch-spinner-fixture_alpha" to disappear (switch completes)',
      'Assert data-testid="profile-card-fixture_alpha-active-dot" is visible',
      'Assert data-testid="active-profile-name" contains text "fixture / alpha"',
      'Assert data-testid="model-row-base-url" contains text "alpha.example.com"',
      'Assert data-testid="model-row-haiku" contains text "alpha-model"'
    ]
  },
  {
    id: 'test-4',
    name: 'Switch to second profile updates active state away from first',
    steps: [
      'First switch to fixture_alpha (same as Test 3)',
      'Then click data-testid="profile-card-fixture_beta-switch"',
      'Wait for spinner to disappear',
      'Assert data-testid="profile-card-fixture_beta-active-dot" is visible',
      'Assert data-testid="active-profile-name" contains text "fixture / beta"',
      'Assert data-testid="model-row-base-url" contains text "beta.example.com"'
    ]
  },
  {
    id: 'test-5',
    name: 'Refresh button rescans and re-renders profile list',
    steps: [
      'Click data-testid="refresh-button"',
      'Assert data-testid="profile-list" is still visible after refresh',
      'Assert profile count is still >= 2'
    ]
  },
  {
    id: 'test-6',
    name: 'Active profile detail shows correct model mapping rows',
    steps: [
      'Switch to fixture_alpha if not already active',
      'Assert data-testid="model-row-haiku" is visible and non-empty',
      'Assert data-testid="model-row-sonnet" is visible and non-empty',
      'Assert data-testid="model-row-opus" is visible and non-empty',
      'Assert data-testid="model-row-base-url" is visible and non-empty'
    ]
  }
] as const;