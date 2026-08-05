# AirVIA Reliability and Product Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn AirVIA into a safe, local-first public VIA v13 configurator for three to five verified keyboards, then ship the Dark Control Surface UI and verified feature workflows.

**Architecture:** Replace the split BLE send paths with one serialized, typed device-session command boundary. Synchronization builds and validates a snapshot before committing device state. UI capabilities and feature status determine whether controls are editable.

**Tech Stack:** Svelte 5, TypeScript, Vite, Tailwind CSS v4, Vitest, Web Bluetooth API, native browser storage/export.

## Global Constraints

- Initial public support: three to five hardware-verified keyboards.
- Local-first; no backend, accounts, analytics, telemetry, or cloud sync.
- No new dependency for queueing, storage, dialogs, icons, or styling.
- Device writes require loaded definition, verified compatibility, connected transport, and successful synchronization.
- Unsupported features render read-only or unavailable, never fabricated editable values.
- Preserve existing user changes; do not revert unrelated worktree changes.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

## File Map

- Modify `src/ble/queue.ts`: one typed request queue with deterministic retry/exhaustion behavior.
- Modify `src/ble/transport.ts`: BLE lifecycle, packet slicing, write/notification routing, disconnect rejection.
- Modify `src/ble/dispatch.ts`: thin public command API backed by transport queue.
- Create `src/ble/dispatch.test.ts`: concurrent, error, timeout, and disconnect command tests.
- Modify `src/device/synchronizer.ts`: validated atomic snapshot synchronization.
- Create `src/device/synchronizer.test.ts`: sync success, malformed response, and atomic failure tests.
- Modify `src/core/commands.ts`: strict response decoders and validators.
- Modify `src/core/v3-definition.ts`: finite/range/resource validation.
- Modify `src/store/app.svelte.ts`: explicit device/feature status and safe dirty generations.
- Modify `src/App.svelte`: prerequisite workflow, error presentation, stale-state reset, definition reload behavior.
- Modify `src/ui/ConnectBar.svelte`: explicit connection/sync/apply states.
- Modify `src/ui/keymap/*`: gated, keyboard-friendly keymap editing.
- Modify `src/ui/shared/Modal.svelte`, `TabBar.svelte`, `BrowserCheck.svelte`: accessibility and unsupported-browser behavior.
- Modify `src/app.css`: Dark Control Surface tokens and global focus/reduced-motion rules.
- Create `src/store/profile.ts` and `src/store/profile.test.ts`: versioned local profile serialization/export/import.
- Modify `.github/workflows/deploy.yml`, `package.json`, `README.md`: quality gates, support docs, and actual workflow.

---

### Task 1: Lock Down Queue Contracts

**Files:**
- Modify: `src/ble/queue.ts`
- Test: `src/ble/queue.test.ts`

**Interfaces:**
- `PacketQueue.enqueue(request: CommandRequest): void`
- `PacketQueue.takeForSend(): RawPacket | null`
- `PacketQueue.handleResponse(packet: RawPacket): QueueResult`
- `PacketQueue.retry(): RawPacket | null`
- `PacketQueue.clear(): void`

- [ ] **Step 1: Write failing tests** for exact request packet extraction, response matching, `0xFF` error response, retry exhaustion advancing to the next request, and queue depth rejection.
- [ ] **Step 2: Run `pnpm vitest run src/ble/queue.test.ts`;** confirm tests fail on the current raw-packet mismatch and stranded queue behavior.
- [ ] **Step 3: Implement the smallest typed queue change.** Error packets must be classified before normal matcher evaluation. Exhaustion must remove the failed request and expose the next request.
- [ ] **Step 4: Run `pnpm vitest run src/ble/queue.test.ts`;** expected: all queue tests pass.
- [ ] **Step 5: Run `pnpm check`;** expected: no `@ts-expect-error` is needed by queue callers.

### Task 2: Replace Callback-Swapping Dispatch

**Files:**
- Modify: `src/ble/transport.ts`, `src/ble/dispatch.ts`
- Create: `src/ble/dispatch.test.ts`
- Test: `src/ble/transport.test.ts`

**Interfaces:**
- `BLETransport.sendCommand(request: CommandRequest): Promise<RawPacket>`
- `BLETransport.send(packet: RawPacket): Promise<void>` only if a real fire-and-forget caller remains; otherwise delete it.
- `sendViaCommand(packet: RawPacket, timeoutMs?: number): Promise<RawPacket>` delegates to the serialized transport method.

- [ ] **Step 1: Add fake characteristic tests** asserting exact `Uint8Array` bytes written and response resolution from a dispatched notification.
- [ ] **Step 2: Add failing dispatch tests** for two concurrent commands, unrelated response, write rejection, timeout, device error, and disconnect.
- [ ] **Step 3: Run `pnpm vitest run src/ble/dispatch.test.ts src/ble/transport.test.ts`;** expected: new tests fail against callback swapping and uncaught write rejection.
- [ ] **Step 4: Implement one in-flight request path.** Keep packet logging as a permanent observer. Reject active and pending requests on disconnect. Chain write rejection into the request promise.
- [ ] **Step 5: Fix `DataView` conversion** with `new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)` for info and notification packets.
- [ ] **Step 6: Run the focused tests, then `pnpm check`;** expected: all pass with no suppressed contract errors.

### Task 3: Make Definition Input Safe and Visible

**Files:**
- Modify: `src/core/v3-definition.ts`, `src/App.svelte`
- Test: `src/core/v3-definition.test.ts`

- [ ] **Step 1: Add failing parser tests** for non-finite values where applicable, negative/zero dimensions, out-of-bounds implicit positions, excessive key count, and invalid schema error messages.
- [ ] **Step 2: Run `pnpm vitest run src/core/v3-definition.test.ts`;** expected: new validation tests fail.
- [ ] **Step 3: Add finite/range/resource checks** before allocating or rendering; cap file size in the UI before `FileReader`.
- [ ] **Step 4: Replace the silent `catch`** with the existing toast path and show actionable `DefinitionError` text.
- [ ] **Step 5: Run focused parser tests and `pnpm check`;** expected: pass.

### Task 4: Atomic Synchronization and Capability State

**Files:**
- Modify: `src/device/synchronizer.ts`, `src/core/commands.ts`, `src/store/app.svelte.ts`
- Create: `src/device/synchronizer.test.ts`

**Interfaces:**
- `type DeviceSnapshot = { layers: number; keymap: number[]; encoders?: number[]; lighting?: LightingState; layoutOptions?: number; macros?: MacroSnapshot }`
- `synchronizeDevice(): Promise<DeviceSnapshot>` builds, validates, and commits only through the application session owner.

- [ ] **Step 1: Add fake-command tests** for complete keymap chunking, returned offset mismatch, short/odd data, invalid bounds, and failure after an early chunk.
- [ ] **Step 2: Run `pnpm vitest run src/device/synchronizer.test.ts`;** expected: tests fail because global state is currently mutated incrementally.
- [ ] **Step 3: Implement local snapshot assembly** and strict response validation. Do not write store state until required reads complete.
- [ ] **Step 4: Represent unavailable encoder/macro/lighting/layout values explicitly** instead of zero-filling them. Read a feature only when protocol support is verified.
- [ ] **Step 5: Commit snapshot once and set `ready` only after commit;** failure sets `error` and clears/stales device-derived state.
- [ ] **Step 6: Run focused tests, `pnpm check`, and `pnpm test`;** expected: full suite passes.

### Task 5: Repair Connection, Definition, and Dirty Workflow

**Files:**
- Modify: `src/App.svelte`, `src/store/app.svelte.ts`, `src/ui/ConnectBar.svelte`
- Test: `src/device/synchronizer.test.ts` or create `src/workflow.test.ts` if test seams require it.

- [ ] **Step 1: Add failing workflow tests** for load-then-connect, connect-then-load, definition replacement while dirty, disconnect while dirty, and edit during apply.
- [ ] **Step 2: Run the focused workflow tests;** expected: current order and global dirty clearing fail.
- [ ] **Step 3: Gate connect/sync/edit** on definition and device readiness; loading a definition while connected invalidates sync and offers resync.
- [ ] **Step 4: Reset or stale-mark state on every disconnect** and disable all write controls outside verified ready state.
- [ ] **Step 5: Replace global save count with feature/channel dirty tracking or disable edits during apply.** Preserve edits created after apply begins.
- [ ] **Step 6: Surface connection, sync, write, and persistence errors** using one visible error state.
- [ ] **Step 7: Run `pnpm test`, `pnpm check`, and `pnpm build`;** expected: pass.

### Task 6: Ship the Reliable Keymap Vertical Slice

**Files:**
- Modify: `src/ui/keymap/KeymapGrid.svelte`, `KeymapCell.svelte`, `KeycodePicker.svelte`, `LayerSelector.svelte`
- Modify: `src/ui/shared/Modal.svelte`
- Test: add the smallest applicable component/workflow tests; keep protocol behavior covered by Tasks 1-5.

- [ ] **Step 1: Add keyboard interaction tests** for focusable cells, arrow movement, Enter/open, Escape/close, clear, and focus restoration.
- [ ] **Step 2: Implement roving focus and selected-cell focus** without adding a component library.
- [ ] **Step 3: Make picker selection await acknowledged dispatch** and show pending/failed state rather than optimistic authoritative state.
- [ ] **Step 4: Implement accessible dialog behavior**: `aria-labelledby`, initial focus, focus trap, focus restoration, Escape, and mobile sheet layout.
- [ ] **Step 5: Add keymap zoom/reset and responsive `100dvh` containment.**
- [ ] **Step 6: Run tests, `pnpm check`, and `pnpm build`;** expected: pass.

### Task 7: Add Local Profiles and Backup

**Files:**
- Create: `src/store/profile.ts`
- Create: `src/store/profile.test.ts`
- Modify: `src/App.svelte`, profile navigation components as needed.

**Interfaces:**
- `serializeProfile(profile: KeyboardProfile): string`
- `parseProfile(input: string): KeyboardProfile`
- `exportProfile(profile: KeyboardProfile): Blob`
- `importProfile(file: File): Promise<KeyboardProfile>`
- `diffProfiles(current: KeyboardProfile, next: KeyboardProfile): ProfileDiff`

- [ ] **Step 1: Write failing tests** for schema version, round-trip serialization, invalid profile rejection, unsupported feature preservation, and keymap diff output.
- [ ] **Step 2: Run `pnpm vitest run src/store/profile.test.ts`;** expected: fail before implementation.
- [ ] **Step 3: Implement versioned plain-object serialization** with finite/range validation and no packet-log data.
- [ ] **Step 4: Add browser-native export/import** with an explicit user action and visible failure messages.
- [ ] **Step 5: Add profile diff preview** before any device apply operation.
- [ ] **Step 6: Run focused tests, `pnpm check`, and `pnpm build`;** expected: pass.

### Task 8: Apply Dark Control Surface and Responsive Shell

**Files:**
- Modify: `src/app.css`, `src/App.svelte`, `src/ui/ConnectBar.svelte`, `src/ui/TabBar.svelte`, `src/ui/shared/BrowserCheck.svelte`
- Modify: affected editor panels only where needed to consume shared state classes.

- [ ] **Step 1: Add visual smoke checklist** for desktop, mobile portrait, landscape, zoomed text, loading, empty, error, dirty, ready, read-only, and unavailable states.
- [ ] **Step 2: Replace global light tokens** with Dark Control Surface tokens and shared panel/status/button rules.
- [ ] **Step 3: Keep the app rendered without Web Bluetooth** and disable only hardware actions with an explanation.
- [ ] **Step 4: Build desktop left rail and mobile bottom navigation** while keeping primary/advanced surfaces distinct.
- [ ] **Step 5: Add responsive `100dvh`, safe-area, reduced-motion, focus, and overflow behavior.**
- [ ] **Step 6: Implement tab/button semantics consistently**; prefer ordinary navigation buttons if full ARIA tabs add no value.
- [ ] **Step 7: Run `pnpm check`, `pnpm test`, and `pnpm build`;** manually smoke-test the live Vite preview.

### Task 9: Verify Additional Features One by One

**Files:**
- Modify: `src/device/synchronizer.ts`, `src/core/protocol.ts`, `src/ui/encoder/EncoderEditor.svelte`, `src/ui/lighting/LightingPanel.svelte`, `src/ui/layout/LayoutOptions.svelte`, `src/ui/macro/MacroEditor.svelte`
- Test: matching feature tests beside each implementation.

- [ ] **Step 1: Add fixture-driven tests** for one supported keyboard per feature before enabling its UI.
- [ ] **Step 2: Implement encoder read/write round-trip** and remove duplicate keycode picker markup by reusing one picker.
- [ ] **Step 3: Implement lighting reads, debounced preview, channel-aware persistence, and one dirty event per interaction.**
- [ ] **Step 4: Name layout options where firmware metadata exists; otherwise label raw flags as advanced read-only/write capability.**
- [ ] **Step 5: Implement macro buffer chunks and action-oriented editing only after firmware packet fixtures prove the data model.**
- [ ] **Step 6: Keep any unsupported feature explicitly read-only and test that controls cannot issue writes.**
- [ ] **Step 7: Run focused tests, full tests, type check, and build after each feature.**

### Task 10: Public Release Hardening

**Files:**
- Modify: `package.json`, `.github/workflows/deploy.yml`, `README.md`, `vite.config.ts`
- Create: browser smoke test files only if the chosen existing test tooling supports them without a new dependency.

- [ ] **Step 1: Add `svelte-check` using an existing installed dependency if available;** otherwise record dependency approval before adding one.
- [ ] **Step 2: Make CI run on pull requests and verify check, Svelte check, tests, and production build.**
- [ ] **Step 3: Declare supported Node and pnpm versions and document the GitHub Pages base path.**
- [ ] **Step 4: Update README to the real load/connect flow, current test command, feature capability matrix, browser support, troubleshooting, privacy, and hardware support.**
- [ ] **Step 5: Run `pnpm check`, `pnpm test`, `pnpm build`, inspect generated asset paths, and verify the deployed route.**
- [ ] **Step 6: Review the complete diff and run `git diff --check` before release.**
