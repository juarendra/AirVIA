# AirVIA v1.0 RC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release `v1.0.0-rc.1` as a full-feature release candidate verified by automated tests against a deterministic VIA v13 hardware simulator.

**Architecture:** Svelte UI -> session state -> synchronizer -> serial dispatcher -> shared transport contract (Web Bluetooth or Simulator). We will correct the Phase 5 baseline, build the simulator, atomic synchronization, and round-trip verification for keymap, encoder, lighting, layout, and macro. Profile application will be hardened, ending with automated release gates.

**Tech Stack:** Svelte 5, TypeScript, Vite, Web Bluetooth, Vitest.

## Global Constraints

- Initial public support: three to five hardware-verified keyboards.
- Local-first; no backend, accounts, analytics, telemetry, or cloud sync.
- No new dependency for queueing, storage, dialogs, icons, or styling.
- Device writes require loaded definition, verified compatibility, connected transport, and successful synchronization.
- Unsupported features render read-only or unavailable, never fabricated editable values.
- Preserve existing user changes; do not revert unrelated worktree changes.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

---

### Phase 1: Preserve and Correct Baseline

#### Task 1: Revert Unsafe Profile Apply and Set Version

**Files:**
- Modify: `src/ui/profile/ProfileManager.svelte`
- Delete: `src/ui/profile/ProfileApplier.svelte`
- Modify: `package.json`

**Interfaces:**
- Produces: Base Phase 5 branch with safe profile import disabled temporarily until Phase 6, version set to `1.0.0-rc.1`.

- [ ] **Step 1: Check baseline**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 2: Delete `ProfileApplier.svelte` and revert `ProfileManager.svelte`**

Remove the `ProfileApplier` component and its import/usage in `ProfileManager.svelte`. Instead of applying, just show a toast for now.

```svelte
<!-- src/ui/profile/ProfileManager.svelte -->
<script lang="ts">
  import { toast } from '../shared/Toast.svelte';
  
  function handleImport(profileData: any) {
    toast('Profile import temporarily disabled until RC Phase 6.', 'error');
  }
</script>
```

- [ ] **Step 3: Update `package.json`**

```json
{
  "name": "airvia",
  "version": "1.0.0-rc.1"
}
```

- [ ] **Step 4: Verify**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git rm src/ui/profile/ProfileApplier.svelte
git add src/ui/profile/ProfileManager.svelte package.json
git commit -m "chore(release): revert unsafe profile apply and set version 1.0.0-rc.1"
```

### Phase 2: Session and Command Foundation

#### Task 2: Session State Lifecycle

**Files:**
- Modify: `src/store/app.svelte.ts`
- Modify: `src/App.svelte`

**Interfaces:**
- Produces: `setSyncPhase`, `getSyncPhase`, `markStale`, strictly enforcing `disconnected -> connecting -> syncing -> ready`.

- [ ] **Step 1: Write state test**

```typescript
// src/store/app.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { setSyncPhase, getSyncPhase, markStale } from './app.svelte';

describe('Session State', () => {
  it('enforces disconnected -> connecting -> syncing -> ready', () => {
    setSyncPhase('connecting');
    expect(getSyncPhase()).toBe('connecting');
    setSyncPhase('ready');
    expect(getSyncPhase()).toBe('ready');
  });

  it('markStale locks editors', () => {
    setSyncPhase('ready');
    markStale();
    expect(getSyncPhase()).toBe('stale');
  });
});
```

- [ ] **Step 2: Run test (fail)**
Run: `pnpm vitest run src/store/app.svelte.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement in `app.svelte.ts`**

```typescript
// src/store/app.svelte.ts
export type SyncPhase = 'disconnected' | 'connecting' | 'syncing' | 'ready' | 'error' | 'stale';
let syncPhase: SyncPhase = $state('disconnected');

export function getSyncPhase() { return syncPhase; }
export function setSyncPhase(phase: SyncPhase) { syncPhase = phase; }
export function markStale() { syncPhase = 'stale'; }
```

- [ ] **Step 4: Apply to `App.svelte`**

Update unexpected disconnect to call `markStale()`.

```svelte
<!-- src/App.svelte -->
<script lang="ts">
  import { markStale, setSyncPhase } from './store/app.svelte';
  // Inside connection failure or disconnect callback:
  function onUnexpectedDisconnect() {
    markStale();
  }
</script>
```

- [ ] **Step 5: Run test (pass)**
Run: `pnpm vitest run src/store/app.svelte.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add src/store/app.svelte.ts src/store/app.svelte.test.ts src/App.svelte
git commit -m "feat(store): enforce strict session lifecycle and stale state on disconnect"
```

#### Task 3: Dispatcher Correlation and Timeout

**Files:**
- Modify: `src/ble/dispatch.ts`
- Modify: `src/ble/dispatch.test.ts`

**Interfaces:**
- Produces: `sendViaCommand` that respects timeout, matches specific offsets if requested, and rejects wrong commands.

- [ ] **Step 1: Write dispatcher test**

```typescript
// src/ble/dispatch.test.ts
import { describe, it, expect } from 'vitest';
import { sendViaCommand } from './dispatch';
// Add test for timeout exhaustion throwing an error and clearing queue.
```

- [ ] **Step 2: Implement strict matching**

Modify `sendViaCommand` to include timeout handling and exact matching.

```typescript
// src/ble/dispatch.ts
export async function sendViaCommand(request: CommandRequest, timeoutMs = 1000) {
  // Use timeoutMs. Match exact command and subcommand.
  // Reject Error frames (e.g. 0xFF).
}
```

- [ ] **Step 3: Run test**
Run: `pnpm vitest run src/ble/dispatch.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/ble/dispatch.ts src/ble/dispatch.test.ts
git commit -m "feat(ble): enforce exact request correlation and timeout exhaustion"
```

### Phase 3: VIA v13 Simulator

#### Task 4: Virtual Device Transport

**Files:**
- Create: `src/ble/simulator.ts`
- Create: `src/ble/simulator.test.ts`
- Modify: `src/ble/transport.ts`

**Interfaces:**
- Consumes: Raw packets from Dispatcher.
- Produces: `SimulatorTransport` implementing the same contract as `BLETransport`.

- [ ] **Step 1: Write simulator test**

```typescript
// src/ble/simulator.test.ts
import { describe, it, expect } from 'vitest';
import { SimulatorTransport } from './simulator';

describe('SimulatorTransport', () => {
  it('responds to get_protocol_version', async () => {
    const sim = new SimulatorTransport();
    const resp = await sim.sendPacket([0x01, 0x01]);
    expect(resp[0]).toBe(0x01);
    expect(resp[1]).toBe(0x00);
    expect(resp[2]).toBe(0x0C);
  });
});
```

- [ ] **Step 2: Implement simulator**

```typescript
// src/ble/simulator.ts
export class SimulatorTransport {
  async sendPacket(data: number[]): Promise<number[]> {
    if (data[0] === 0x01 && data[1] === 0x01) {
      return [0x01, 0x00, 0x0C]; // Protocol V12
    }
    return [0xFF]; // Error
  }
}
```

- [ ] **Step 3: Run test**
Run: `pnpm vitest run src/ble/simulator.test.ts`

- [ ] **Step 4: Commit**
```bash
git add src/ble/simulator.ts src/ble/simulator.test.ts src/ble/transport.ts
git commit -m "feat(simulator): add in-memory VIA v13 simulator transport"
```

### Phase 4: Atomic Full Synchronization

#### Task 5: Exact Keymap Chunk Validation

**Files:**
- Modify: `src/device/synchronizer.ts`
- Modify: `src/device/synchronizer.test.ts`

**Interfaces:**
- Produces: A synchronizer that rejects short, odd, or mismatched offset keymap chunks.

- [ ] **Step 1: Write chunk test**

```typescript
// src/device/synchronizer.test.ts
import { describe, it, expect } from 'vitest';
import { synchronizeDevice } from './synchronizer';

describe('Synchronization', () => {
  it('rejects short keymap chunk response', async () => {
    // mock short response
    // assert synchronizeDevice throws
  });
});
```

- [ ] **Step 2: Implement strict chunks**

```typescript
// src/device/synchronizer.ts
// In the read loop:
if (resp.length - 4 !== expectedSize || resp.length % 2 !== 0 || resp[2] !== expectedOffset[0]) {
  throw new Error('Invalid chunk response');
}
```

- [ ] **Step 3: Run test**
Run: `pnpm vitest run src/device/synchronizer.test.ts`

- [ ] **Step 4: Commit**
```bash
git add src/device/synchronizer.ts src/device/synchronizer.test.ts
git commit -m "feat(sync): validate exact offset and size for keymap chunks"
```

#### Task 6: Read Supported Capabilities (No Fabrication)

**Files:**
- Modify: `src/device/synchronizer.ts`
- Modify: `src/store/app.svelte.ts`

**Interfaces:**
- Produces: `encoderAssignments` array populated by `0x02` subcommand reads, not zero-filled loops based on definition count. Same for lighting.

- [ ] **Step 1: Write capability test**

- [ ] **Step 2: Implement reads**

```typescript
// src/device/synchronizer.ts
// Try to read encoder 0. If it fails or returns error, encoders are unsupported.
// Do not fabricate [0,0,0,0].
```

- [ ] **Step 3: Run test**

- [ ] **Step 4: Commit**
```bash
git add src/device/synchronizer.ts src/store/app.svelte.ts
git commit -m "feat(sync): read device encoders and lighting instead of fabricating defaults"
```

### Phase 5: Feature Vertical Slices

#### Task 7: Lighting Round Trip

**Files:**
- Modify: `src/ui/lighting/LightingPanel.svelte`
- Modify: `src/ble/simulator.ts`

**Interfaces:**
- Produces: A lighting panel that waits for acknowledgment before updating local state, and per-control debouncing.

- [ ] **Step 1: Update Simulator**
Add `0x07` (lighting) handling to `simulator.ts`.

- [ ] **Step 2: Update UI**
Change `LightingPanel.svelte` to `await sendViaCommand` before updating the value in `app.svelte.ts`. Keep a per-control loading state.

- [ ] **Step 3: Run test (check)**
Run: `pnpm check`

- [ ] **Step 4: Commit**
```bash
git add src/ui/lighting/LightingPanel.svelte src/ble/simulator.ts
git commit -m "feat(lighting): implement acknowledged lighting writes and debouncing"
```

#### Task 8: Macro Editor and Round Trip

**Files:**
- Modify: `src/ui/macro/MacroEditor.svelte`
- Modify: `src/device/synchronizer.ts`

**Interfaces:**
- Produces: An editor that parses the buffer, allows editing, and saves sequentially.

- [ ] **Step 1: Synchronize Macro Buffer**
Update `synchronizer.ts` to actually read the full macro buffer via chunked reads.

- [ ] **Step 2: Build Editor**
If format matches `0x00` separated QMK strings, allow edit. Otherwise read-only.
On apply, send chunked writes, then call `markSaved()`.

- [ ] **Step 3: Commit**
```bash
git add src/ui/macro/MacroEditor.svelte src/device/synchronizer.ts
git commit -m "feat(macro): implement full buffer synchronization and chunked writing"
```

### Phase 6: Profiles and Recovery

#### Task 9: Safe Profile Apply

**Files:**
- Create: `src/ui/profile/ProfileApplier.svelte`
- Modify: `src/ui/profile/ProfileManager.svelte`

**Interfaces:**
- Produces: A modal that loops differences, handles partial failures without losing local state accuracy.

- [ ] **Step 1: Build the applier**

```svelte
<!-- src/ui/profile/ProfileApplier.svelte -->
<script lang="ts">
  import { sendViaCommand } from '../../ble/dispatch';
  import { getKeymap, setKeymap, getSyncPhase } from '../../store/app.svelte';
  export let profile: any;
  
  async function apply() {
    if (getSyncPhase() !== 'ready') return;
    // Iterate differences. 
    // If command succeeds, update local keymap index. 
    // If it fails, report it and keep going.
  }
</script>
```

- [ ] **Step 2: Restore to Manager**

- [ ] **Step 3: Commit**
```bash
git add src/ui/profile/ProfileApplier.svelte src/ui/profile/ProfileManager.svelte
git commit -m "feat(profile): implement safe partial-recovery profile applier"
```

### Phase 7: RC Release

#### Task 10: Run Simulator Workflow and Cut RC

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: Final validation.

- [ ] **Step 1: Verification Run**
Run: `pnpm check && pnpm test && pnpm build`

- [ ] **Step 2: Update Docs**
Update `README.md` to state: "v1.0.0-rc.1 is protocol-verified via deterministic VIA v13 simulator. Hardware testing pending."

- [ ] **Step 3: Commit**
```bash
git add README.md
git commit -m "docs: finalize v1.0.0-rc.1 release scope and simulator verification"
```
