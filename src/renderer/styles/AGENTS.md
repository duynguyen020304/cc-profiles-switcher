<!-- Parent: ../AGENTS.md -->

# src/renderer/styles - CSS Styles

CSS styles for the application. Single file containing global styles, CSS variables, animations, and component-specific styling.

## Key File

| File | Purpose |
|------|---------|
| `globals.css` | Global styles, CSS custom properties, scrollbar styling, animations |

## Styling Conventions

### Color Palette

| Purpose | Color | Value |
|---------|-------|-------|
| Background | Dark | `#0d0d0d` |
| Text | Primary | `#e5e5e5` |
| Accent | Orange | `#f97316` |
| Link | Teal | `#2dd4bf` |
| Link hover | Light teal | `#5eead4` |
| Success | Green | `#22c55e` (for active dot pulse) |
| Selection | Orange tint | `rgba(249, 115, 22, 0.25)` |

### Typography

- **Font stack**: `'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace`
- **Base size**: `14px`
- **Line height**: `1.5`
- **Font smoothing**: `antialiased` (webkit), `grayscale` (moz)

### Scrollbar

Custom thin scrollbar with hover effect:
- Width: `6px`
- Track: `transparent`
- Thumb: `rgba(255, 255, 255, 0.1)` → hover: `rgba(255, 255, 255, 0.18)`
- Border radius: `3px`

## Animations

| Animation | Usage | Duration |
|-----------|-------|----------|
| `spin` | Loading spinner | `0.8s linear infinite` |
| `fadeIn` | Element entrance | `0.2s ease-out` |
| `pulse-green` | Active profile indicator | `2s ease-in-out infinite` |

### Animation Classes

```css
.spinner          /* Rotating spinner */
.fade-in          /* Fade in with upward motion */
.active-dot-pulse /* Pulsing green dot for active profile */
```

## Component Styles

### Profile Card Hover

```css
.profile-card:hover:not(.active):not(.switching)
```

- Background: `rgba(255, 255, 255, 0.04)`
- Left border: `rgba(249, 115, 22, 0.35)`

### Focus States

- Focus ring: `1px solid #f97316` with `2px` offset
- Selection background: `rgba(249, 115, 22, 0.25)`

## For AI Agents

- **Dark theme by default**: Background is `#0d0d0d`, not a toggle
- **No CSS modules**: Global styles only, components use inline styles
- **Frameless window**: No window chrome styles needed here (handled in TopBar component)
- **No CSS custom properties defined**: Values are hardcoded, not extracted to variables
- **Maintain consistency**: New animations should follow existing timing patterns (0.2s-0.8s)

### Adding New Styles

1. Add to `globals.css` - single stylesheet for simplicity
2. Use RGBA for opacity variations of existing colors
3. Keep transitions under 0.3s for UI responsiveness
4. Test against dark background `#0d0d0d`
5. Ensure sufficient contrast with `#e5e5e5` text

### Avoid

- Do not create additional CSS files
- Do not introduce CSS-in-JS libraries
- Do not add light theme variables (not supported)
- Do not modify scrollbar width (fixed at 6px for consistency)