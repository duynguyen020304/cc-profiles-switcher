# AGENTS.md

Claude Code Profile Switcher - Electron + React + TypeScript desktop app for switching Claude Code API profiles.

## Project Overview

A cross-platform desktop widget that manages and switches between Claude Code API profiles. Built with Electron for the desktop layer, React for the UI, and TypeScript with strict mode.

## Build System

Uses [electron-vite](https://electron-vite.org/) for building:

```bash
npm run dev      # Development mode with hot reload
npm run build    # Production build
npm run start    # Preview production build
npm run dist     # Package for distribution
```

Platform-specific builds:
```bash
npm run build:win   # Windows (NSIS installer)
npm run build:mac   # macOS (DMG)
npm run build:linux # Linux (AppImage, deb)
```

## Testing

Uses [Vitest](https://vitest.dev/) with Testing Library:

```bash
npm run test       # Run all tests
npm run test:watch # Watch mode
```

Test structure:
- `tests/unit/` - Unit tests
- `tests/e2e/` - End-to-end tests

## Project Structure

```
src/
  main/           # Electron main process
    index.ts      # Entry point
    profileManager.ts  # Profile management logic
    db.ts         # Database operations (better-sqlite3)
    ipc.ts        # IPC handlers
  preload/        # Preload scripts (bridge between main/renderer)
    index.ts
  renderer/       # React UI (renderer process)
    index.html    # Entry HTML
    main.tsx      # React entry
    App.tsx       # Main app component
    components/   # UI components
    hooks/        # React hooks
    styles/       # CSS styles
    types/        # TypeScript type definitions

tests/
  unit/           # Unit tests
  e2e/            # End-to-end tests

build/            # Build resources (icons, entitlements)
dist/             # Build output directory
out/              # electron-vite output
```

## Configuration Files

| File | Purpose |
|------|---------|
| `electron.vite.config.ts` | Build configuration for main/preload/renderer |
| `electron-builder.yml` | Cross-platform packaging config |
| `tsconfig.json` | TypeScript base config (strict mode) |
| `tsconfig.node.json` | TypeScript config for Node/Electron processes |
| `tsconfig.web.json` | TypeScript config for renderer (React) |

## CI/CD

GitHub Actions workflow: `.github/workflows/build-release.yml`

- Triggered on version tags (`v*`) or manual dispatch
- Builds on Windows, macOS, and Ubuntu
- Creates GitHub Release with artifacts
- Supports auto-update via electron-updater

Release process:
1. Update version in `package.json`
2. Create git tag: `git tag v1.x.x`
3. Push tag: `git push origin v1.x.x`
4. CI builds and creates release

## For AI Agents

- **IMPORTANT**: Always update version tag in `package.json` after each commit that changes functionality
- Use electron-vite for builds (not raw Vite or Webpack)
- Run `npm run build && npm run test` before committing
- Follow TypeScript strict mode (enabled in tsconfig.json)
- IPC communication: main process handles profile DB operations, renderer displays UI
- Database: better-sqlite3 for local profile storage
- Components are in `src/renderer/components/`, hooks in `src/renderer/hooks/`