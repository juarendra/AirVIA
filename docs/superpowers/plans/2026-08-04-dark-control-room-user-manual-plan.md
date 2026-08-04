# AirVIA Dark Control Room and User Manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a cohesive, colorful Dark Control Room UI across desktop and mobile, plus a complete searchable Indonesian user manual inside AirVIA.

**Architecture:** Keep the current Svelte 5 single-page application and store-driven destination model. Add typed destinations, responsive navigation, one contextual workspace header, and a focused local manual content module; preserve existing BLE and feature logic. CSS variables and Tailwind theme tokens in `src/app.css` provide one visual system without dependencies.

**Tech Stack:** Svelte 5, TypeScript, Tailwind CSS 4, Vite 6, Vitest 3, Testing Library Svelte, jsdom.

## Global Constraints

- Application controls and navigation remain English; manual content is Bahasa Indonesia.
- Follow `docs/superpowers/specs/2026-08-04-dark-control-room-user-manual-design.md`.
- No new dependency, router, backend, analytics, telemetry, external font request, Markdown parser, CMS, or component framework.
- Preserve BLE, protocol, synchronization, simulator, profile safety, and editor behavior.
- Manual remains readable while disconnected, without a definition, and without Web Bluetooth.
- Unsupported features remain unavailable or read-only; never fabricate capability.
- Status combines color with text, icon, or accessible label.
- Mobile touch targets are at least 44px; use `100dvh` and safe-area padding.
- Respect `prefers-reduced-motion`; maintain visible focus and WCAG AA contrast.
- Do not modify unrelated untracked planning documents.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

## File Map

- `src/app.css`: visual tokens, ambient background, typography, focus, scrollbar, motion.
- `src/store/app.svelte.ts`: typed `AppDestination` state.
- `src/ui/navigation.ts`: destination groups and page metadata.
- `src/ui/TabBar.svelte`: desktop rail and mobile navigation.
- `src/ui/ConnectBar.svelte`: device status and connection controls.
- `src/ui/layout/WorkspaceHeader.svelte`: page context and status cards.
- `src/ui/manual/manual-content.ts`: typed Indonesian content and native search.
- `src/ui/manual/ManualPage.svelte`: search, contents, article renderer, empty state.
- Existing editor components: presentation changes only unless specified.

---

### Task 1: Dark Control Room Tokens

**Files:**
- Modify: `src/app.css`
- Test: `src/ui/theme.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--air-*` and utility classes used by every later task.

- [ ] **Step 1: Write the failing token contract test**

```typescript
// src/ui/theme.test.ts
import { describe, expect, it } from 'vitest';
import css from '../app.css?raw';

describe('Dark Control Room theme', () => {
  it('defines the approved semantic tokens and reduced motion', () => {
    for (const token of ['--air-page', '--air-surface', '--air-raised', '--air-cyan', '--air-violet', '--air-lime', '--air-amber', '--air-red']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
```

- [ ] **Step 2: Run the focused test**

Run: `pnpm vitest run src/ui/theme.test.ts`
Expected: FAIL because `--air-page` is absent.

- [ ] **Step 3: Replace ad-hoc global colors with approved tokens**

Define `--air-page:#060912`, `--air-base:#080d17`, `--air-sidebar:#0b111c`, `--air-surface:#111a28`, `--air-raised:#17263a`, `--air-elevated:#1d2b40`, semantic text/accent colors, spacing, radius, font stacks, ambient radial gradients, dark scrollbar, focus ring, and reduced-motion override. Map Tailwind `@theme` colors to these values so existing utility usage can migrate incrementally.

- [ ] **Step 4: Verify theme and project**

Run: `pnpm vitest run src/ui/theme.test.ts && pnpm check`
Expected: PASS, 0 diagnostics.

- [ ] **Step 5: Commit**

```bash
git add src/app.css src/ui/theme.test.ts
git commit -m "style(ui): define dark control room tokens"
```

### Task 2: Typed Navigation Model

**Files:**
- Create: `src/ui/navigation.ts`
- Create: `src/ui/navigation.test.ts`
- Modify: `src/store/app.svelte.ts`
- Modify: `src/ui/shared/Icon.svelte`

**Interfaces:**
- Produces: `AppDestination`, `DestinationItem`, `navigationGroups`, `primaryMobileDestinations`, `advancedMobileDestinations`, and `destinationById()`.

- [ ] **Step 1: Write the failing navigation test**

```typescript
import { describe, expect, it } from 'vitest';
import { destinationById, navigationGroups, primaryMobileDestinations } from './navigation';

describe('navigation model', () => {
  it('groups primary, workspace, advanced, and manual destinations', () => {
    expect(navigationGroups.map(group => group.label)).toEqual(['Configure', 'Workspace', 'Advanced', 'Help']);
    expect(destinationById('manual')?.label).toBe('Manual Pengguna');
    expect(primaryMobileDestinations.map(item => item.id)).toEqual(['keymap', 'encoder', 'lighting', 'macros', 'manual']);
  });
});
```

- [ ] **Step 2: Run it and confirm failure**

Run: `pnpm vitest run src/ui/navigation.test.ts`
Expected: FAIL because `navigation.ts` does not exist.

- [ ] **Step 3: Implement exact navigation types and metadata**

```typescript
export type AppDestination = 'keymap' | 'encoder' | 'lighting' | 'macros' | 'profiles' | 'layout' | 'actions' | 'console' | 'manual';
export type DestinationItem = { id: AppDestination; label: string; icon: string; title: string; description: string };
export const navigationGroups = [
  { label: 'Configure', items: ['keymap', 'encoder', 'lighting', 'macros'] },
  { label: 'Workspace', items: ['profiles', 'layout'] },
  { label: 'Advanced', items: ['actions', 'console'] },
  { label: 'Help', items: ['manual'] },
] as const;
```

Add complete metadata for all destinations. Type `activeTab`, `getActiveTab()`, and `setActiveTab()` with `AppDestination`. Add only missing icon paths required by the metadata: profile, help, menu, layers, and close.

- [ ] **Step 4: Run focused and existing tests**

Run: `pnpm vitest run src/ui/navigation.test.ts src/store/app.svelte.test.ts && pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/navigation.ts src/ui/navigation.test.ts src/store/app.svelte.ts src/ui/shared/Icon.svelte
git commit -m "refactor(ui): type application destinations"
```

### Task 3: Responsive Navigation Shell

**Files:**
- Modify: `src/ui/TabBar.svelte`
- Modify: `src/ui/ConnectBar.svelte`
- Modify: `src/App.svelte`
- Test: `src/ui/TabBar.test.ts`

**Interfaces:**
- Consumes: navigation metadata from Task 2.
- Produces: grouped desktop rail, mobile bottom bar, and accessible Advanced sheet.

- [ ] **Step 1: Write rendered navigation tests**

Render `TabBar`, assert group labels, `Manual Pengguna`, active `aria-current="page"`, five mobile primary buttons, Advanced open/close controls, and selection of `profiles` from the sheet.

- [ ] **Step 2: Run focused test**

Run: `pnpm vitest run src/ui/TabBar.test.ts`
Expected: FAIL because current navigation has no groups, manual, or Advanced sheet.

- [ ] **Step 3: Build the responsive navigation**

Use one metadata source. Desktop: grouped vertical rail with sentence case and active cyan-violet tint. Mobile: fixed bottom primary navigation and a modal-like Advanced sheet with focusable close button, labelled heading, safe-area padding, and Escape handling. Selecting an item closes the sheet.

- [ ] **Step 4: Restyle connection context and shell**

Convert `ConnectBar` to a desktop device card plus compact mobile header. Keep current callbacks and save logic unchanged. Update `App.svelte` layout to use dark ambient background, desktop rail width 240-256px, flexible main region, mobile bottom padding, and no permanently rendered `ProfileManager` in the rail.

- [ ] **Step 5: Verify**

Run: `pnpm vitest run src/ui/TabBar.test.ts && pnpm check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/TabBar.svelte src/ui/TabBar.test.ts src/ui/ConnectBar.svelte src/App.svelte
git commit -m "feat(ui): add responsive control room shell"
```

### Task 4: Workspace Context Header

**Files:**
- Create: `src/ui/layout/WorkspaceHeader.svelte`
- Create: `src/ui/layout/WorkspaceHeader.test.ts`
- Modify: `src/App.svelte`
- Modify: `src/ui/keymap/LayerSelector.svelte`

**Interfaces:**
- Consumes: destination metadata and existing store getters.
- Produces: page heading, definition/device context, Connection/Protocol/Layer/Changes cards, and contextual layer controls.

- [ ] **Step 1: Write failing component tests**

Mock store values, render `WorkspaceHeader`, and assert `Keymap Workspace`, `Disconnected`, `Protocol`, `Layer`, `Changes`, and a textual pending count. Assert Manual omits irrelevant protocol/layer cards.

- [ ] **Step 2: Run focused test**

Run: `pnpm vitest run src/ui/layout/WorkspaceHeader.test.ts`
Expected: FAIL because component is absent.

- [ ] **Step 3: Implement the header**

Use semantic `header`, `h1`, and status lists. Derive content from `destinationById(getActiveTab())`. Render only relevant cards; no duplicate ready labels adjacent to the device card. Move `LayerSelector` inside keymap/encoder contextual controls rather than as a full-width strip.

- [ ] **Step 4: Integrate in App**

Render header above every destination except where manual uses its own article title while still retaining shell context. Keep all current editor conditions and add `profiles` and `manual` branches for later tasks.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/ui/layout/WorkspaceHeader.test.ts && pnpm check`

```bash
git add src/ui/layout/WorkspaceHeader.svelte src/ui/layout/WorkspaceHeader.test.ts src/ui/keymap/LayerSelector.svelte src/App.svelte
git commit -m "feat(ui): add contextual workspace header"
```

### Task 5: Definition Onboarding and Browser Fallback

**Files:**
- Create: `src/ui/definition/DefinitionOnboarding.svelte`
- Modify: `src/App.svelte`
- Modify: `src/ui/shared/BrowserCheck.svelte`
- Test: `src/ui/definition/DefinitionOnboarding.test.ts`

**Interfaces:**
- Consumes: `onLoad: () => void`, current definition, Web Bluetooth availability.
- Produces: reachable load/replace action without floating controls; non-blocking browser warning.

- [ ] **Step 1: Test onboarding behavior**

Render with no definition and assert `Load V3 definition`, accepted format explanation, manual link, and callback execution. Render `BrowserCheck` without Bluetooth and assert children still render beside a warning.

- [ ] **Step 2: Run focused tests**

Run: `pnpm vitest run src/ui/definition/DefinitionOnboarding.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement onboarding and non-blocking fallback**

Create a dark raised onboarding card. Change `BrowserCheck` from a gate to a persistent warning banner that disables no offline content. Add optional `bluetoothAvailable` snippet/prop only if needed; otherwise detect as now and always render children.

- [ ] **Step 4: Integrate definition actions**

Delete the fixed bottom-left button from `App.svelte`. Render onboarding when no definition exists. After load, expose `Replace definition` in device context. Keep hidden file input, size validation, drag/drop, parser, and forced disconnect behavior unchanged. Restyle drag overlay with dark scrim and cyan border.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/ui/definition/DefinitionOnboarding.test.ts && pnpm check`

```bash
git add src/ui/definition/DefinitionOnboarding.svelte src/ui/definition/DefinitionOnboarding.test.ts src/ui/shared/BrowserCheck.svelte src/App.svelte
git commit -m "feat(ui): replace floating definition loader"
```

### Task 6: Keymap Control Room Canvas

**Files:**
- Modify: `src/ui/keymap/KeymapGrid.svelte`
- Modify: `src/ui/keymap/KeymapCell.svelte`
- Modify: `src/ui/keymap/KeycodePicker.svelte`
- Test: `src/ui/keymap/KeymapCell.test.ts`

**Interfaces:**
- Produces: dimensional dark keycaps and accessible selected/locked states without changing key writes.

- [ ] **Step 1: Write keycap state tests**

Render production `KeymapCell` with mocked store values. Assert accessible key label contains keycode, selected state uses `aria-pressed="true"`, and keyboard activation selects the target.

- [ ] **Step 2: Run focused tests**

Run: `pnpm vitest run src/ui/keymap/KeymapCell.test.ts`
Expected: FAIL because `aria-pressed` is absent.

- [ ] **Step 3: Restyle keycaps and canvas**

Replace white/slate classes with blue-gray gradients, inner highlight, lower shadow, off-white labels, cyan hover/focus/selected states, and muted `KC_NO`/transparent states. Preserve all geometry and roving focus logic. Add textual/accessibility markers where pending or failed state exists; do not invent per-key state if store cannot provide it.

- [ ] **Step 4: Restyle locked and picker states**

Use dark scrim with synchronization text and recovery guidance. Restyle picker modal/search/categories using theme tokens while retaining focus management and behavior. Keep definition/matrix/navigation footer quiet and readable.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/ui/keymap/KeymapCell.test.ts src/ui/keymap/KeycodePicker.test.ts && pnpm check`

```bash
git add src/ui/keymap/KeymapGrid.svelte src/ui/keymap/KeymapCell.svelte src/ui/keymap/KeymapCell.test.ts src/ui/keymap/KeycodePicker.svelte
git commit -m "style(keymap): build dark keyboard canvas"
```

### Task 7: Feature Pages and Profiles Destination

**Files:**
- Modify: `src/ui/encoder/EncoderEditor.svelte`
- Modify: `src/ui/lighting/LightingPanel.svelte`
- Modify: `src/ui/layout/LayoutOptions.svelte`
- Modify: `src/ui/macro/MacroEditor.svelte`
- Modify: `src/ui/profile/ProfileManager.svelte`
- Modify: `src/ui/profile/ProfileApplier.svelte`
- Modify: `src/ui/device/DeviceActions.svelte`
- Modify: `src/ui/console/PacketLog.svelte`
- Modify: `src/ui/shared/Modal.svelte`
- Modify: `src/ui/shared/Toast.svelte`
- Modify: `src/App.svelte`

**Interfaces:**
- Produces: consistent dark pages and dedicated `profiles` destination; no behavior changes.

- [ ] **Step 1: Move profiles into main destination**

Render `ProfileManager` only when `activeTab === 'profiles'`. Give it page structure with current backup name, Export, Import, compatibility note, and existing `ProfileApplier`. Preserve parser and partial recovery exactly.

- [ ] **Step 2: Restyle feature editors**

Replace every white/slate card/input with approved surface/text/border tokens. Keep semantic amber Experimental, violet Read-only/Diagnostics, lime success, and red destructive states. Ensure labels and controls remain associated and inputs retain at least 44px mobile height.

- [ ] **Step 3: Restyle overlays and diagnostics**

Apply dark inset monospace treatment to packet log with TX/RX labels. Restyle Modal and Toast once so consumers inherit consistent surfaces, borders, shadows, and focus. Add component cleanup for Lighting debounce timers on destroy to avoid callbacks after unmount.

- [ ] **Step 4: Run phase boundary checks**

Run: `pnpm check && pnpm test && pnpm build`
Expected: 0 diagnostics, all tests pass, production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/ui src/App.svelte
git commit -m "style(ui): unify feature pages and profiles"
```

### Task 8: Typed Indonesian Manual Content

**Files:**
- Create: `src/ui/manual/manual-content.ts`
- Create: `src/ui/manual/manual-content.test.ts`

**Interfaces:**
- Produces: `ManualBlock`, `ManualSection`, `manualSections`, and `searchManual(query: string): ManualSection[]`.

- [ ] **Step 1: Write completeness and search tests**

Assert exactly 17 unique section IDs, required first/last titles, every section has summary/keywords/blocks, search by title (`macro`), keyword (`bluetooth`), and body (`simulator`) returns expected sections, blank search returns all sections, and unknown search returns `[]`.

- [ ] **Step 2: Run focused test**

Run: `pnpm vitest run src/ui/manual/manual-content.test.ts`
Expected: FAIL because module is absent.

- [ ] **Step 3: Define minimal block types**

```typescript
export type ManualBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'steps'; items: string[] }
  | { type: 'notes'; items: string[] }
  | { type: 'warning'; title: string; text: string }
  | { type: 'statuses'; items: Array<{ label: string; meaning: string; action: string }> };
export type ManualSection = { id: string; title: string; summary: string; keywords: string[]; blocks: ManualBlock[] };
```

- [ ] **Step 4: Write all required content**

Create complete Bahasa Indonesia content for Mulai Cepat, Browser, Definition V3, Connect, Sync/status, Keymap, Encoder, Lighting, Layout, Macro, Profiles, Save/Apply/Verify, Disconnect/recovery, BLE troubleshooting, definition/profile errors, privacy/security, and RC/hardware limitations. Mention English UI labels verbatim where users must click them. State `v1.0.0-rc.1` is simulator-verified and hardware acceptance is pending.

- [ ] **Step 5: Implement native search**

Trim/lowercase query. Flatten title, summary, keywords, and every block's textual fields with a small exhaustive function. Preserve document order; no ranking and no dependency.

- [ ] **Step 6: Verify and commit**

Run: `pnpm vitest run src/ui/manual/manual-content.test.ts && pnpm check`

```bash
git add src/ui/manual/manual-content.ts src/ui/manual/manual-content.test.ts
git commit -m "docs(manual): add Indonesian user guidance"
```

### Task 9: Searchable Manual Page

**Files:**
- Create: `src/ui/manual/ManualPage.svelte`
- Create: `src/ui/manual/ManualPage.test.ts`
- Modify: `src/App.svelte`

**Interfaces:**
- Consumes: `manualSections` and `searchManual()` from Task 8.
- Produces: full in-app manual destination.

- [ ] **Step 1: Write rendered manual tests**

Render `ManualPage` and assert labelled search input, `Manual Pengguna AirVIA`, table-of-contents links, all initial sections, filtered result after typing `Bluetooth`, no-results state for nonsense query, and `Reset pencarian` restoring content. Assert section headings have stable IDs.

- [ ] **Step 2: Run focused tests**

Run: `pnpm vitest run src/ui/manual/ManualPage.test.ts`
Expected: FAIL because component is absent.

- [ ] **Step 3: Implement manual layout**

Use `article`, aside `nav aria-label="Daftar isi manual"`, labelled search field, semantic headings/lists, block-specific rendering, amber warning cards, status tables/cards, and `Back to top`. Desktop uses sticky contents; mobile uses a native `details` disclosure. Use local links `href="#manual-<id>"`.

- [ ] **Step 4: Integrate destination**

Render `ManualPage` for `activeTab === 'manual'`. Ensure no definition, sync phase, or Bluetooth guard blocks it. Add manual links from definition onboarding and browser warning by calling `setActiveTab('manual')`.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/ui/manual/ManualPage.test.ts src/ui/manual/manual-content.test.ts && pnpm check`

```bash
git add src/ui/manual/ManualPage.svelte src/ui/manual/ManualPage.test.ts src/App.svelte src/ui/definition/DefinitionOnboarding.svelte src/ui/shared/BrowserCheck.svelte
git commit -m "feat(manual): add searchable in-app guide"
```

### Task 10: Mobile, Accessibility, and Visual State Audit

**Files:**
- Modify: `src/app.css`
- Modify: `src/ui/TabBar.svelte`
- Modify: `src/ui/layout/WorkspaceHeader.svelte`
- Modify: affected feature components found by light-theme search
- Test: `src/ui/shell-accessibility.test.ts`

**Interfaces:**
- Produces: final responsive and accessibility guarantees.

- [ ] **Step 1: Search for conflicting classes**

Run: `rg -n "bg-white|bg-slate-50|text-slate-[4-9]|border-slate|blue-50" src --glob "*.svelte"`
Expected: list only deliberate exceptions; replace all mixed-light editor styling.

- [ ] **Step 2: Add shell accessibility smoke test**

Render shell/navigation with mocked store and assert one main landmark, labelled desktop/mobile nav, current destination, visible Manual control, Advanced disclosure, and no icon-only button without an accessible name.

- [ ] **Step 3: Complete responsive CSS**

Verify desktop rail, mobile header, fixed bottom bar, Advanced sheet, safe areas, manual TOC collapse, keyboard horizontal overflow, 44px touch targets, and reduced motion. Avoid JS viewport listeners.

- [ ] **Step 4: Run complete phase checks**

Run: `pnpm check && pnpm test && pnpm build`
Expected: 0 diagnostics; all tests and build pass.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "fix(ui): complete responsive accessible states"
```

### Task 11: Documentation and Release Verification

**Files:**
- Modify: `README.md`
- Create: `docs/manual-visual-checklist.md`

**Interfaces:**
- Produces: reproducible visual review checklist and accurate manual discoverability docs.

- [ ] **Step 1: Update README**

Document `Manual Pengguna` location, English UI/Indonesian manual language split, Chrome/Edge limitation for BLE only, and that offline manual/definition/profile functionality remains available without Web Bluetooth. Do not claim real-hardware verification.

- [ ] **Step 2: Write visual checklist**

Include desktop 1440x900 and mobile 390x844 checks for shell hierarchy, navigation reachability, ambient gradient restraint, keymap overflow, no light cards, manual search/TOC, empty/sync/error/read-only states, focus visibility, reduced motion, and 44px touch controls.

- [ ] **Step 3: Run final verification**

Run: `pnpm check && pnpm test && pnpm build`
Expected: 0 warnings/errors, all tests pass, production assets emitted.

- [ ] **Step 4: Inspect final diff**

Run: `git diff --check && git status --short && git diff --stat $(git merge-base origin/master HEAD)..HEAD`
Expected: no whitespace errors; only intended application, test, README, and checklist files.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/manual-visual-checklist.md
git commit -m "docs: document control room manual workflow"
```

## Final Acceptance

- Desktop and mobile expose every destination.
- No floating definition button remains.
- No conflicting light editor surfaces remain.
- Keymap visual states are distinct and accessible.
- Profiles have a dedicated workspace destination.
- Manual contains all 17 complete Indonesian sections.
- Search covers title, summary, keyword, and body text.
- Manual works disconnected, without definition, and without Web Bluetooth.
- UI outside manual remains English.
- Existing BLE and feature tests remain green.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
