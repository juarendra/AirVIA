# Visual Review Checklist — AirVIA v1.0.0-rc.1

Run through manually at **1440×900** (desktop) and **390×844** (mobile, iPhone 14) before publishing.

## Shell Hierarchy

- [ ] Desktop: sidebar rail visible (240px), main area fills remaining width
- [ ] Mobile: bottom tab bar visible, no sidebar
- [ ] Mobile "More" button opens advanced sheet (profiles, layout, actions, console)
- [ ] All 9 destinations reachable on both viewports

## Navigation Reachability

- [ ] Desktop: all groups (Configure, Workspace, Advanced, Help) rendered in sidebar
- [ ] Desktop: Manual Pengguna under Help group
- [ ] Mobile: keymap, encoder, lighting, macros, manual on primary bar
- [ ] Mobile: profiles, layout, actions, console in "More" sheet

## Ambient Gradient Restraint

- [ ] Background is dark (`bg-bg-dark`), no bright/white surfaces
- [ ] Cards and panels use `bg-surface-dark` / `bg-surface-raised`
- [ ] No conflicting light-colored editor or card remains

## Keymap Overflow

- [ ] Matrix grid scrolls horizontally when columns exceed viewport
- [ ] Layer selector visible and functional
- [ ] Keymap cells have distinct visual states:
  - [ ] Default: surface-dark background
  - [ ] Selected: accent-cyan/10 background with accent-violet inset ring
  - [ ] Hover: surface-elevated background
- [ ] Keycode picker opens/closes, selects keycodes correctly

## No Light Cards

- [ ] All UI surfaces use dark theme tokens
- [ ] No legacy white/light backgrounds in any destination
- [ ] No floating definition button (replaced by DefinitionOnboarding card)

## Manual Search / TOC

- [ ] Desktop: sidebar TOC (200px) with scrollable section links
- [ ] Mobile: collapsible "Daftar Isi" `<details>` above manual content
- [ ] Search input filters sections by title, summary, keywords, and body text
- [ ] "Reset" button clears search and restores full TOC
- [ ] Empty search result shows "Tidak ditemukan" with reset link
- [ ] All 17 sections present and render correctly

## Empty / Sync / Error / Read-Only States

- [ ] No definition loaded: DefinitionOnboarding card with drag-drop zone
- [ ] Connected, synced: "Synced" indication, editors enabled
- [ ] Disconnected after sync: editors marked stale (read-only visual), ConnectBar shows warning
- [ ] BrowserCheck banner visible when Web Bluetooth unavailable

## Focus Visibility

- [ ] Tab through interactive elements: focus ring visible on each
- [ ] Buttons, inputs, links, summaries show `focus:outline-none focus:ring-2 focus:ring-accent-cyan` or equivalent
- [ ] No focus-trapped elements that can't be escaped

## Reduced Motion

- [ ] Enable `prefers-reduced-motion: reduce` in browser DevTools
- [ ] No animated transitions or sliding panels
- [ ] Static rendering without layout shift

## 44px Touch Controls

- [ ] Mobile bottom tab bar: each button area ≥44px tall
- [ ] "More" sheet items: ≥44px touch target
- [ ] Mobile manual `<summary>` element: ≥44px touch target
- [ ] Connect button: ≥44px touch target
