# AirVIA Dark Control Room and User Manual Design

Date: 2026-08-04
Status: Approved

## Goal

Replace AirVIA's visually inconsistent mixed light/dark interface with a cohesive, colorful Dark Control Room experience and add a complete Indonesian user manual inside the application. Preserve existing BLE, protocol, synchronization, simulator, and feature behavior.

## Product Direction

AirVIA should look like a focused keyboard configuration workstation rather than a generic collection of panels. The visual system uses layered navy surfaces, restrained ambient cyan-violet gradients, semantic status colors, dimensional keycaps, and clear workspace hierarchy.

The interface remains English. The user manual is Indonesian and available as a full secondary page inside the existing application shell.

No new package, router, backend, analytics, telemetry, external documentation service, or design-system framework is required.

## Current Problems

- The shell is dark while many editor surfaces still use white and slate styling.
- Primary editing, profiles, destructive actions, and diagnostics have equal navigation weight.
- The floating definition button competes with sidebar content and looks temporary.
- Device, synchronization, capability, layer, and pending-change context are fragmented.
- The keymap canvas lacks depth and clear selected, pending, failed, and unavailable states.
- Desktop navigation is compressed on mobile rather than adapted.
- Spacing, radius, typography, surfaces, and status colors vary between components.
- No in-app user documentation explains the complete workflow or recovery paths.

## Visual Direction

### Aesthetic

Use Dark Control Room: near-black navy foundations, layered blue-tinted surfaces, soft cyan and violet ambient light, and restrained semantic color. The interface should feel rich without covering every component in saturated color or glow.

Ambient gradients belong on the application background and selected workspace regions. They must not reduce text contrast or compete with editor content.

### Tokens

Define the complete system once in `src/app.css` and reuse it throughout components.

Colors:

- Page: `#060912`.
- Base workspace: `#080d17`.
- Sidebar: `#0b111c`.
- Surface: `#111a28`.
- Raised surface: `#17263a`.
- Elevated control: `#1d2b40`.
- Border: `rgba(255,255,255,.07)`.
- Border strong: `rgba(125,211,252,.18)`.
- Primary text: `#edf3ff`.
- Secondary text: `#91a0b7`.
- Muted text: `#718198`.
- Cyan interaction: `#42dceb`.
- Violet diagnostics: `#a78bfa`.
- Lime ready/success: `#a3e635`.
- Amber pending/warning: `#f5b942`.
- Red failure/destructive: `#fb5b62`.

Spacing uses a 4px base scale: 4, 8, 12, 16, 24, 32, 48, and 64px.

Radius:

- Controls: 8-10px.
- Cards: 12-14px.
- Major workspace panels: 16-18px.
- Pills only for statuses and compact filters.

Typography:

- UI: `Inter`, `Geist`, system UI, or installed system fallback. No external font request is required.
- Technical values and packet data: `JetBrains Mono`, `SF Mono`, or system monospace fallback.
- Micro-labels: 10-12px, uppercase, 0.1-0.14em letter spacing.
- Main heading: 18-24px depending on viewport.
- Body text: 14-16px.

Motion uses 150-220ms opacity and transform transitions. Reduced-motion preference disables nonessential animation.

## Application Shell

### Desktop

Use a 240-256px left rail and one flexible workspace column.

The rail contains:

1. AirVIA brand.
2. Active-device card with keyboard name, connection status, sync status, and verified/unverified state.
3. `Configure`: Keymap, Encoders, Lighting, Macros.
4. `Workspace`: Profiles, Layout.
5. `Advanced`: Device Actions, Packet Console.
6. `Manual Pengguna` at the bottom as a secondary destination.

Navigation uses sentence/title case, not all caps. The active entry gets a low-opacity cyan-violet tint, visible left indicator, bright text, and icon. Inactive entries use muted text and a subtle hover surface.

The main workspace has a context header containing:

- Current page name.
- Keyboard/definition context.
- Active layer when relevant.
- Last synchronization state.
- Pending or failed changes.
- Primary action such as `Apply & verify` only when actionable.

Below the header, compact status cards show Connection, Protocol, Layer, and Changes when relevant. Avoid repeating the same status in multiple nearby locations.

### Mobile

At widths below the existing desktop breakpoint:

- Replace the persistent sidebar with a compact top device header.
- Use bottom navigation for Keymap, Encoders, Lighting, Macros, and Manual.
- Put Profiles, Layout, Device Actions, and Packet Console in an `Advanced` sheet.
- Preserve horizontal scrolling for keyboard layouts.
- Use `100dvh` and safe-area padding.
- Keep touch targets at least 44px.
- Do not cover workspace content with the definition-loading action.

No JavaScript viewport measurement is required; use CSS media queries and native layout.

## Definition Loading

Remove the floating bottom-left definition button. Definition loading belongs in:

- The empty workspace onboarding card when no definition exists.
- The device/sidebar card as a compact replace/reload action after a definition is loaded.
- Drag-and-drop remains available across the shell with a dark, branded overlay.

The empty state explains the required V3 JSON format and the next step after loading.

## Keymap Workspace

The keyboard sits inside a raised canvas with a subtle inner highlight and no light-theme overlay.

Keycaps use:

- Dark blue-gray gradient surface.
- Inner top highlight.
- Soft lower shadow for depth.
- Off-white keycode labels.
- Cyan focus/selected border.
- Amber pending border plus label or marker.
- Red failed border plus error marker.
- Muted unavailable state.

Status cannot rely on color alone. Pending and failed states include text, icon, or accessible label.

The locked/syncing overlay uses a dark translucent scrim, status icon, concise explanation, and recovery action where applicable.

Definition name, matrix dimensions, keyboard navigation hint, and pending-change summary sit in a quiet footer below the canvas.

## Feature Pages

Encoder, Lighting, Layout, Macro, Profile, Device Actions, and Packet Console keep their existing behavior but adopt the shared visual system.

- Editors use dark layered sections instead of white cards.
- Form labels use muted text; current values carry stronger contrast.
- Primary buttons use cyan.
- Destructive actions use red only in confirmation context.
- Experimental or read-only states use amber or violet badges with explanatory text.
- Empty, unavailable, syncing, failed, and read-only states each receive intentional presentation.
- Packet Console uses monospace text, dark inset surface, and distinct TX/RX/error markers.

Do not redesign protocol behavior or enable unsupported controls as part of visual work.

## Profiles

Profile controls move into the `Profiles` workspace page rather than remaining permanently compressed at the bottom of the navigation rail. The rail may show a compact active-profile summary, but profile import/export/apply controls belong in the page.

Profile apply continues to use the existing safety and partial-recovery logic. Visual changes must preserve ready-state guards and failure reporting.

## User Manual

### Placement

Add `manual` to the existing application destination model. Selecting `Manual Pengguna` renders a full page inside the same shell. No URL router is required for this release.

The manual remains accessible while disconnected and without a loaded definition. Unsupported browsers must also be able to read it.

### Language

- Application navigation and controls remain English.
- Manual title, body, section names, instructions, troubleshooting, warnings, and glossary use Bahasa Indonesia.
- Existing English UI labels may appear verbatim inside backticks or screenshots/instruction references.

### Structure

The manual page contains:

- Title and short purpose statement.
- Search field using client-side text filtering.
- Sticky or visible local table of contents on desktop.
- Compact section selector or table-of-contents disclosure on mobile.
- Article sections rendered from local static content.
- `Back to top` action.
- Context links to related manual sections where useful.

Do not add a search dependency. Normalize the query with native string methods and filter section titles, summaries, keywords, and text.

### Content Model

Keep content in one focused TypeScript module rather than embedding a large article in the Svelte component.

Each section has:

```typescript
type ManualSection = {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  blocks: ManualBlock[];
};
```

Blocks support only content needed now: paragraphs, ordered steps, unordered notes, warnings, and key-value status explanations. Do not build a generic Markdown parser or CMS.

### Required Sections

1. Mulai Cepat.
2. Persyaratan Browser.
3. Memuat Definition VIA V3.
4. Menghubungkan Keyboard.
5. Sinkronisasi dan Arti Status.
6. Mengubah Keymap.
7. Mengatur Encoder.
8. Mengatur Lighting.
9. Mengubah Layout.
10. Membuat dan Menyimpan Macro.
11. Export, Import, dan Apply Profile.
12. Save, Apply, dan Verify.
13. Disconnect dan Recovery.
14. Troubleshooting Web Bluetooth.
15. Error Definition dan Profile.
16. Privacy dan Keamanan.
17. Batasan Release Candidate dan Dukungan Hardware.

Every feature section explains:

- Purpose.
- Prerequisites.
- Step-by-step use.
- Meaning of visible states.
- What happens on failure.
- Recovery action.
- Experimental, unavailable, or read-only caveat where applicable.

Manual claims must match implemented behavior. It explicitly states that `v1.0.0-rc.1` is simulator-verified and hardware acceptance remains pending.

## Data and Interaction Flow

### Navigation

1. User selects a destination.
2. Existing store updates active destination.
3. Shell derives page title, navigation group, context controls, and active icon.
4. Main area renders the existing editor or manual page.
5. On mobile, selecting a destination closes the Advanced sheet if open.

### Manual Search

1. User enters an Indonesian or matching English UI term.
2. Input is trimmed and lowercased.
3. Local manual sections are filtered by title, summary, keywords, and flattened block text.
4. Matching sections remain in document order.
5. No result shows a helpful empty state and reset action.

Search never mutates application/device state.

## Error and Empty States

- No definition: onboarding card with load action and manual link.
- Disconnected: editors lock; manual remains available.
- Syncing: dark scrim and progress copy.
- Sync error: persistent inline status with reconnect guidance.
- Unsupported capability: explanatory unavailable state, no fabricated editor.
- Read-only or experimental capability: visible badge and limitation copy.
- Manual search no result: show query, suggest broader terms, and provide clear reset.
- Unsupported browser: preserve offline definition/profile/manual functionality while BLE actions are disabled.

## Accessibility

- WCAG AA contrast for body and control text.
- Visible focus rings on every interactive element.
- Semantic `nav`, `main`, headings, buttons, labels, lists, and article sections.
- Active navigation uses `aria-current` or correct tab semantics.
- Manual search has a visible label.
- Manual sections use stable heading IDs for table-of-contents links.
- Status combines color with label/icon.
- Minimum 44px touch targets on mobile.
- Keyboard navigation and focus restoration remain intact.
- Respect `prefers-reduced-motion`.

## Component Boundaries

Reuse existing shared `Icon`, `Modal`, and `Toast` components.

Expected focused additions:

- `src/ui/layout/AppShell.svelte`: responsive rail/top/bottom shell only if extracting it reduces `App.svelte`; otherwise keep the minimum shell edit in `App.svelte`.
- `src/ui/layout/WorkspaceHeader.svelte`: contextual title, status, and action region.
- `src/ui/manual/manual-content.ts`: typed Indonesian content.
- `src/ui/manual/ManualPage.svelte`: search, table of contents, and content rendering.
- `src/ui/manual/ManualPage.test.ts`: one production-component test for navigation/search/accessibility behavior.

Do not create a component library, generic card framework, page registry abstraction, Markdown renderer, or routing framework.

## Testing

Minimum automated checks:

- Active navigation renders correct visual and accessible state.
- Selecting Manual renders Indonesian title and required section headings.
- Manual search matches title, keyword, and body text.
- Empty search result and reset work.
- Manual works with no definition and disconnected state.
- Main editor remains locked outside `ready`; manual remains readable.
- Definition loading remains reachable without the floating button.
- Mobile primary and Advanced destinations remain reachable through rendered controls.
- Existing keymap keyboard interaction and modal tests stay green.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

Browser screenshots or visual review should cover desktop and mobile, but automated correctness gates remain required.

## Delivery Sequence

### Phase 1: Tokens and Shell

Define tokens, ambient background, typography, focus, reduced motion, desktop rail, mobile header, bottom navigation, Advanced sheet, and workspace header.

Exit: all destinations remain reachable on desktop and mobile with no mixed light shell surfaces.

### Phase 2: Keymap and Shared States

Restyle keymap canvas, keycaps, layer controls, definition onboarding, drag overlay, selected/pending/failed/locked states, shared buttons, inputs, badges, and empty/error presentations.

Exit: keymap workflow remains functionally unchanged and its states are visually distinct and accessible.

### Phase 3: Feature Pages

Apply tokens and hierarchy to Encoder, Lighting, Layout, Macro, Profiles, Device Actions, Packet Console, shared modals, and toasts. Move profile operations into their own page.

Exit: no editor uses conflicting light-theme cards; unsupported and experimental states remain truthful.

### Phase 4: User Manual

Add manual content model, complete Indonesian content, search, table of contents, responsive presentation, and in-app navigation.

Exit: all 17 sections are complete, searchable, accessible while disconnected, and behaviorally accurate.

### Phase 5: Polish and Verification

Review desktop/mobile hierarchy, spacing, contrast, focus, reduced motion, overflow, empty/loading/error states, and production build. Update README to point users to the in-app manual.

Exit: checks, tests, build, and visual review pass without changing protocol behavior.

## Definition of Done

- Dark Control Room is visually consistent across all application pages.
- Color adds orientation and depth without excessive saturation or glow.
- Desktop and mobile navigation match their intended structures.
- Definition loading no longer depends on a floating bottom-left button.
- Keymap selected, pending, failed, unavailable, and locked states are distinct and accessible.
- Complete Indonesian manual is available in-app while disconnected.
- Manual search and table of contents work without dependencies.
- UI remains English outside the manual.
- No unsupported hardware or feature claim is introduced.
- Existing behavior and safety guards remain intact.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
