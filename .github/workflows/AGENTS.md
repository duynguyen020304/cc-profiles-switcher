<!-- Parent: ../AGENTS.md -->

# .github/workflows - GitHub Actions CI/CD Workflows

Purpose: GitHub Actions CI/CD workflows for cross-platform Electron builds and releases.

## Structure

```
.github/workflows/
└── build-release.yml    # Main build and release workflow
```

## Key File: build-release.yml

### Overview

Cross-platform build pipeline triggered by version tags or manual dispatch. Produces distributable installers for Windows, macOS, and Linux with auto-update metadata.

### Workflow Triggers

| Trigger | Condition | Use Case |
|--------|-----------|----------|
| `push.tags` | Tag matches `v*` | Automated releases |
| `workflow_dispatch` | Manual trigger | Testing, one-off builds |

### Build Matrix

| Platform | Runner | Output Artifacts |
|----------|--------|------------------|
| Windows | `windows-latest` | `.exe`, `.nsis*.zip` |
| macOS | `macos-latest` | `.dmg`, `.zip`, `.blockmap` |
| Linux | `ubuntu-latest` | `.AppImage`, `.deb`, `.rpm`, `.snap` |

### Jobs

**build** (parallel per platform):
1. Checkout repository
2. Setup Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Rebuild native dependencies for Electron (`better-sqlite3`)
5. Build application (`npm run build`)
6. Package Electron app (`npm run dist`)
7. Upload artifacts to GitHub

**release** (after all builds complete):
1. Download all platform artifacts
2. Download auto-update metadata
3. Create GitHub release (draft by default)

### Required Secrets

| Secret | Platform | Required |
|--------|----------|----------|
| `github_token` | All | Yes (auto-provided) |
| `mac_certs` | macOS | No (optional signing) |
| `mac_certs_password` | macOS | No (optional signing) |
| `windows_certs` | Windows | No (optional signing) |
| `windows_certs_password` | Windows | No (optional signing) |

## AI Agent Instructions

### Triggering a Release

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:
- Build on all three platforms in parallel
- Upload artifacts to GitHub
- Create a draft release

### Manual Build (No Tag)

1. Navigate to GitHub Actions
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Set draft option
5. Run

**Note:** Manual dispatch builds artifacts but only creates a release if triggered from a tag.

### Important Constraints

1. **Concurrency**: New tag pushes cancel in-progress builds. Avoid rapid successive tags.

2. **Native Dependencies**: The workflow rebuilds `better-sqlite3` for Electron. Adding new native modules requires updating the rebuild step:
   ```yaml
   - name: Rebuild native dependencies for Electron
     run: |
       npm install --save-dev @electron/rebuild
       npx @electron/rebuild -f -w better-sqlite3,new-native-module
   ```

3. **Artifact Retention**: Artifacts expire after 5 days. Download promptly.

4. **Draft Releases**: Created as drafts by default. Review and publish manually:
   - Navigate to Releases
   - Edit draft
   - Add release notes
   - Publish

### Code Signing Setup

To enable signed builds:

**macOS:**
1. Export certificate as base64: `base64 -i cert.p12 | pbcopy`
2. Add `mac_certs` secret with base64 content
3. Add `mac_certs_password` secret with certificate password

**Windows:**
1. Export certificate as base64
2. Add `windows_certs` secret with base64 content
3. Add `windows_certs_password` secret with certificate password

### Workflow Modifications

When modifying `build-release.yml`:

1. Test changes with manual dispatch before relying on tag triggers
2. Verify matrix builds pass on all platforms
3. Check artifact uploads complete successfully
4. Ensure release creation works with both tag and dispatch triggers

### Related Configuration

- `electron-builder.yml` - Packaging configuration
- `package.json` - Build scripts (`npm run build`, `npm run dist`)
- `electron.vite.config.ts` - Build toolchain configuration