# AirVIA Product Roadmap Design

Date: 2026-08-03
Status: Approved

## Product Direction

AirVIA becomes a public, local-first VIA v13 keyboard configurator with a polished **Dark Control Surface** interface. Initial public support targets three to five verified keyboards, not unverified broad compatibility.

The complete workflow is: load definition, connect and verify a BLE keyboard, synchronize authoritative state, edit supported features, preview/apply/persist changes, save local profiles and drafts, export/import backups, and recover safely from disconnects or partial failures.

No backend, account system, cloud sync, analytics, telemetry, or network data collection is required for the initial product.

## Audit Summary

Current baseline: Svelte 5, Vite, TypeScript, Tailwind CSS, Web Bluetooth; `pnpm check` passes and 92 tests pass.

Critical findings:

1. `BLETransport.send()` passes a raw packet into `PacketQueue`, although the queue expects a `CommandRequest`; the suppressed type error can produce invalid editor writes.
2. `sendViaCommand()` bypasses the queue and swaps one global response callback, so concurrent commands can consume wrong responses.
3. The documented connect-then-load flow starts synchronization before a definition exists and never retries after loading one.
4. Save sends only `saveCustomValue(0x02)` but clears dirty state for every feature.
5. Disconnect leaves application synchronization state ready, allowing edits to stale state.
6. Encoder, macro, layout, and lighting values are not fully synchronized; defaults can appear authoritative.
7. Responses lack strict validation for length, offset, size, bounds, and error framing.
8. Definition identity is not verified against the selected device.

UX and product findings:

1. Unsupported browsers lose the entire application instead of only BLE actions.
2. Invalid definition imports fail silently.
3. Write failures are logged or ignored while local state changes.
4. Mobile layout is compressed desktop UI.
5. Keymap editing is mouse-first; modal and tab semantics are incomplete.
6. Primary editing, destructive actions, and diagnostics have equal navigation weight.
7. Existing visual styling is coherent but generic and weakly communicates authoritative, pending, failed, and unsupported state.

Engineering findings:

1. CI runs on pushes to `master`, not pull requests.
2. Plain `tsc` does not provide complete Svelte template/accessibility checking.
3. Transport tests do not exercise writes, notifications, retries, timeouts, or disconnects.
4. Dispatch, synchronizer, workflow, browser, accessibility, and hardware tests are missing.
5. README workflow, feature claims, and test count are stale.
6. Definition parsing lacks file-size, finite-number, coordinate, and collection-size limits.

## Principles

- Hardware state must be truthful; never show defaults as synchronized values.
- Writes fail closed; no write before definition, identity, protocol, and sync checks pass.
- One command path; all requests use one serialized dispatcher and response correlation.
- Local-first recovery; drafts and profiles work without accounts or network services.
- Capabilities drive the UI; unsupported features are hidden or read-only.
- Verification precedes success; a BLE write is not automatically persistence.
- Hardware support is evidence-based and limited to tested devices.
- No speculative infrastructure.

## Architecture

```text
Svelte UI -> Application State -> Device Session -> Serialized Command Queue -> BLE Transport -> VIA Keyboard
```

### Device Session

One session boundary owns connect/disconnect, transport lifecycle, command serialization, response matching, packet validation, timeout/retry handling, device error translation, TX/RX logging, synchronization, identity, and capabilities.

Replace competing `sendPacket()` and `sendViaCommand()` paths with one typed request path. Only one request is in flight unless the protocol is proven to support safe multiplexing. Unrelated notifications may reach permanent observers but cannot resolve the active request.

### Synchronization

Build a local snapshot and validate it before committing device state:

1. Validate definition.
2. Read protocol/firmware identity where supported.
3. Verify definition identity or mark it unverified.
4. Read layer count.
5. Read keymap chunks with exact command, offset, size, parity, and range checks.
6. Read supported encoder, lighting, layout, and macro data.
7. Commit the complete snapshot atomically.

Mandatory failure rejects the snapshot. Optional failure marks only that capability unavailable. Never fabricate values.

### State and Persistence

Device state: `disconnected`, `connecting`, `connected`, `syncing`, `ready`, `stale`, `error`.

Feature state: `synced`, `pending`, `failed`, `read-only`, `unavailable`.

Editors require connected, verified, ready state and a writable capability. Disconnect makes state stale and locks editors.

Authoritative local state changes only after acknowledged command success. Track dirty features/channels, persist only relevant channels, preserve later edits during apply, and verify final state where possible. Do not call the UI `Save Changes` until firmware persistence semantics are verified.

## Local-First Profiles

Use native browser facilities: `localStorage` for lightweight preferences and workspace metadata; export/import JSON as the portable backup; IndexedDB only if profile size requires it.

Profile fields: schema version, name/timestamps, keyboard and definition identity, compatibility metadata, keymap, supported encoder assignments, lighting, layout, and macro data. Exclude raw packet logs and unnecessary identifiers.

Workflow: sync current state, save profile, rename/duplicate/export/import/apply, preview diff, show unsupported/conflicting values, apply serially, persist, verify, and report per-feature results. Partial failure reports exactly what succeeded and what remains unapplied.

## UX

Primary flow:

1. Workspace: load definition, recent devices, or import profile.
2. Definition review: name, matrix, encoder count, compatibility.
3. Connect: request BLE access with concise data-use explanation.
4. Verify/sync: lock editors, show progress, provide retry.
5. Ready: show identity, profile, layer, pending changes, last sync, capabilities.
6. Edit: show per-feature status.
7. Apply: preview diff, confirm, apply serially, persist, verify.
8. Recover: preserve local draft and offer resume, discard, or re-sync.

Default guided order is load then connect, but both orderings may work if synchronization waits for both prerequisites.

Primary navigation: Overview, Keymap, Encoders, Lighting, Macros. Secondary navigation: Profiles, Layout, Device Actions, Packet Console, Settings. Desktop uses a left rail; mobile uses bottom navigation plus Advanced menu.

Keymap adds zoom/reset, overflow cue, active-layer rail, selected/pending/failed states, arrow-key movement, Enter picker, Escape close, search autofocus, focus restoration, clear, and later copy/paste. Undo/redo waits for reliable draft semantics.

Unsupported browsers still render the workspace and support definition/profile work; only BLE actions are disabled.

## Visual Design: Dark Control Surface

Tokens:

- Background `#080b12`, surface `#111927`, raised `#172235`.
- Border `rgba(255,255,255,.08)`, primary text `#eef4ff`, muted `#8393a8`.
- Cyan `#38d8e3` active/connected, lime `#a3e635` ready/success, amber `#f5b942` pending, red `#fb5b62` failure, violet `#a78bfa` diagnostics.

Use 8-12px radii, pills only for statuses, squared keycaps with restrained glows, one sans UI stack, monospace for technical values, and 150-220ms opacity/transform motion with reduced-motion support.

Desktop: top device/status bar, left primary rail, context header, layer/feature controls, main editor canvas, and status/activity region. Mobile: compact top bar, status sheet, bottom primary navigation, full-screen picker sheet, horizontal keymap canvas, `100dvh`, safe-area padding, and no content-covering floating controls.

Accessibility requires WCAG AA contrast, visible focus, 44px targets, label/icon/color state, labelled focus-managed dialogs, keyboard navigation, live regions, and reduced motion.

## Error Model

Categories: `ConnectionError`, `CompatibilityError`, `CommandError`, `TimeoutError`, `SyncError`, `PersistenceError`, and `DefinitionError`.

Each error has a user message, technical diagnostic, affected feature/command, and recovery action. Use toast for transient information, inline status for feature failures, persistent banners for disconnect/compatibility/sync/persistence failures, and Packet Console for technical detail. No silent catches on trust boundaries or device writes.

## Verification

Test command serialization, exact packets, valid/unrelated/malformed/error responses, write rejection, timeout/retry/exhaustion, disconnect, complete and invalid sync chunks, atomic commit, optional capabilities, both load/connect orderings, edit failure/retry, draft recovery, profile apply/partial failure, persistence verification, keyboard editing, dialog focus, mobile navigation, unsupported browser, and all empty/loading/error/read-only states.

For each supported keyboard, acceptance-test connection, clean sync, key remap, power-cycle persistence, supported encoder/lighting/macro round trips, disconnect/reconnect, and wrong-definition rejection.

## Delivery Roadmap

### Phase 0: Safe BLE Foundation

Replace split command paths with one typed serialized queue. Add strict response/error validation, write/timeout/retry/exhaustion/disconnect handling, transport-boundary TX/RX logging, and fake-BLE tests.

Exit: no suppressed transport type mismatch; exact writes and correlation tested; one failure cannot strand later requests.

### Phase 1: Reliable Keymap Vertical Slice

Correct prerequisites, verify compatibility, atomically sync keymap, lock invalid states, implement acknowledged key edits, correct dirty/persistence semantics, stale state on disconnect/definition change, and end-to-end workflow tests.

Exit: load, connect, sync, edit, persist, verify, and reconnect work; failed writes remain visible and recoverable.

### Phase 2: Product Shell and Profiles

Implement Dark Control Surface, onboarding, compatibility screen, local draft/profile schema, export/import, diff preview, unsupported-browser workspace, and consistent persistent errors.

### Phase 3: Verified Features

Add encoder round-trip, debounced lighting round-trip, named/raw layout options, then macro model/editor. Enable only after real-device acceptance tests.

### Phase 4: Public Hardening

Add `svelte-check`, PR CI, unit/integration/browser/build checks, responsive/accessibility verification, tested compatibility matrix, accurate README/troubleshooting/privacy/release docs, and post-deploy smoke verification.

## Deliberate Deferrals

Backend accounts/cloud sync, analytics/telemetry, broad untested hardware support, PWA before recovery value is proven, IndexedDB before size requires it, undo/redo before drafts are reliable, macro editing before protocol proof, and generic design/transport frameworks.

## Definition of Done

Each phase requires type/Svelte checks, relevant tests, production build, affected browser smoke tests, hardware acceptance for affected devices, accurate documentation, no silent device-write failure, and no editable UI for an unverified round trip.

## Immediate Work

Start with Phase 0 only. It fixes root causes shared by synchronization, editors, Save, retry, and disconnect handling. Visual redesign before this repair would make unsafe state more convincing without making it correct.
