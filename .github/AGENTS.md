<!-- Parent: ../AGENTS.md -->

# .github - GitHub Configuration and CI/CD Workflows

Purpose: GitHub configuration and CI/CD workflows for the Claude Code Profile Switcher Electron application.

## Structure

```
.github/
├── workflows/       # GitHub Actions workflow files
│   └── build-release.yml
```

## Workflows

### build-release.yml

Automated build and release pipeline for cross-platform Electron app distribution.

**Triggers:**
- Push tags matching `v*` (e.g., `v1.0.0`)
- Manual dispatch via `workflow_dispatch`

**Build Matrix:**
| Platform | Runner | Outputs |
|----------|--------|---------|
| Windows | `windows-latest` | `.exe`, `.nsis*.zip` |
| macOS | `macos-latest` | `.dmg`, `.zip`, `.blockmap` |
| Linux | `ubuntu-latest` | `.AppImage`, `.deb`, `.rpm`, `.snap` |

**Process:**
1. Checkout repository
2. Setup Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Rebuild native dependencies for Electron (better-sqlite3)
5. Build application (`npm run build`)
6. Package Electron app (`npm run dist`)
7. Upload platform-specific artifacts
8. Create GitHub release (draft by default)

**Release Behavior:**
- Draft release created automatically for tag pushes
- Manual dispatch allows toggling draft status via `inputs.draft`
- Auto-update metadata (`latest*.yml`, `latest*.json`) included

**Code Signing (Optional):**
Configure secrets for signed builds:
- `mac_certs` / `mac_certs_password` - macOS code signing
- `windows_certs` / `windows_certs_password` - Windows code signing

## AI Agent Instructions

When working with GitHub workflows in this directory:

1. **Version Tags**: Workflow triggers on `v*` tags. Create version tags to initiate releases:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Draft Releases**: New releases are drafts by default. Review artifacts before publishing:
   - Navigate to GitHub Releases
   - Edit draft release
   - Add release notes
   - Publish when ready

3. **Matrix Builds**: Changes must work across all three platforms (Windows, macOS, Linux). Test platform-specific code paths before merging.

4. **Native Dependencies**: The workflow rebuilds `better-sqlite3` for Electron. Any new native modules require similar rebuild steps.

5. **Artifact Retention**: Build artifacts retained for 5 days. Download promptly after workflow completion.

6. **Concurrency**: Workflow cancels in-progress runs when new tag pushed. Avoid rapid successive tags.

## Manual Workflow Dispatch

Trigger manual build from GitHub Actions UI:
1. Navigate to Actions tab
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Set `draft` input (true/false)
5. Run workflow

## Related Files

- `electron-builder.yml` - Electron builder configuration
- `package.json` - Build scripts (`build`, `dist`)