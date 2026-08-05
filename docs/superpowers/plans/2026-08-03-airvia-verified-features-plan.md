# AirVIA Phase 3: Verified Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement safe round-trips for Encoders, debounced Lighting, raw Layout flags, and read-only Macro buffers.

**Architecture:** Use acknowledged `sendViaCommand` for all feature edits. `LightingPanel` debounces slider writes to prevent queue overflow. `EncoderEditor` reuses the `KeycodePicker` instead of duplicating its logic. Macros remain read-only data viewers since writing complex buffers isn't proven. Unsupported states (`null` capability) explicitly disable or hide editors.

**Tech Stack:** Svelte 5, TypeScript, Vite, Tailwind CSS v4, Web Bluetooth.

## Global Constraints

- Initial public support: three to five hardware-verified keyboards.
- Local-first; no backend, accounts, analytics, telemetry, or cloud sync.
- No new dependency for queueing, storage, dialogs, icons, or styling.
- Device writes require loaded definition, verified compatibility, connected transport, and successful synchronization.
- Unsupported features render read-only or unavailable, never fabricated editable values.
- Preserve existing user changes; do not revert unrelated worktree changes.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

---

### Task 1: Deduplicate KeycodePicker for Encoders

**Files:**
- Modify: `src/ui/encoder/EncoderEditor.svelte`
- Modify: `src/App.svelte`
- Modify: `src/ui/keymap/KeycodePicker.svelte`

**Interfaces:**
- Consumes: The single `KeycodePicker` component for selecting codes.
- Produces: `EncoderEditor` relies on `KeycodePicker` modal instead of maintaining its own category/search list. `KeycodePicker` now knows whether the `selectedCell` targets a keymap grid or an encoder slot.

- [ ] **Step 1: Modify `src/store/app.svelte.ts` to support Encoder selection**

```typescript
// Define a discriminated union for the selection
export type SelectedTarget = 
  | { type: 'key'; layer: number; row: number; col: number }
  | { type: 'encoder'; layer: number; id: number; cw: boolean };

let selectedTarget = $state<SelectedTarget | null>(null);

export function getSelectedTarget(): SelectedTarget | null { return selectedTarget; }
export function setSelectedTarget(target: SelectedTarget | null) { selectedTarget = target; }

// Replace old getSelectedCell/setSelectedCell references with this new union
```
*Note: Ensure all backwards compatibility with `KeymapGrid` and `KeymapCell` is updated to pass `{ type: 'key', ... }`.*

- [ ] **Step 2: Update `KeycodePicker.svelte` to handle `type === 'encoder'`**

```svelte
// src/ui/keymap/KeycodePicker.svelte inside select(entry)
const target = selectedTarget;
if (!target) return;

setSelectedTarget(null);
search = '';

try {
  if (target.type === 'key') {
    await sendViaCommand(Protocol.setKeycode(target.layer, target.row, target.col, entry.code >> 8, entry.code & 0xFF));
    setKeycodeAt(target.layer, target.row, target.col, entry.code);
  } else if (target.type === 'encoder') {
    await sendViaCommand(Protocol.setEncoderKeycode(target.layer, target.id, target.cw ? 1 : 0, entry.code >> 8, entry.code & 0xFF));
    setEncoderKeycode(target.layer, target.id, target.cw, entry.code);
  }
  markDirty();
} catch (err) {
  console.error('Failed to update', err);
}
```

- [ ] **Step 3: Refactor `EncoderEditor.svelte`**

Remove the duplicated `<Modal>` and search/category logic inside `EncoderEditor.svelte`. Replace the click handler on encoder boxes with `setSelectedTarget({ type: 'encoder', layer: activeLayer, id: i, cw: isCw })`.

- [ ] **Step 4: Run Typecheck**

Run: `pnpm check`
Expected: Passes. All `selectedCell` usages converted safely.

- [ ] **Step 5: Commit**

```bash
git add src/store/app.svelte.ts src/ui/keymap/KeymapCell.svelte src/ui/keymap/KeycodePicker.svelte src/ui/encoder/EncoderEditor.svelte src/App.svelte
git commit -m "refactor(ui): deduplicate keycode picker and apply to encoder editor"
```

### Task 2: Debounce Lighting Writes

**Files:**
- Modify: `src/ui/lighting/LightingPanel.svelte`

**Interfaces:**
- Produces: Real-time UI slider movement but BLE packets only dispatch after user pauses (debounce) or on `change` event, avoiding `PacketQueue` overflow.

- [ ] **Step 1: Write debounce logic inside `LightingPanel.svelte`**

```svelte
<script lang="ts">
  import { getLighting, setLightingBrightness, setLightingEffect, setLightingSpeed, setLightingHue, setLightingSaturation, markDirty, getSyncPhase } from '../../store/app.svelte';
  import { sendViaCommand } from '../../ble/dispatch';
  import { Protocol } from '../../core/protocol';

  let timer: ReturnType<typeof setTimeout> | null = null;

  async function syncLightValue(channel: number, v1: number, v2: number, commitLocalState: () => void) {
    // Optimistic UI for sliders makes sense, but actual write goes to queue
    commitLocalState();
    markDirty();
    
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await sendViaCommand(Protocol.setCustomValue(channel, v1, v2));
      } catch (err) {
        console.error('Lighting sync failed', err);
      }
    }, 150); // 150ms debounce
  }
</script>
```

- [ ] **Step 2: Update sliders to use `syncLightValue`**

Replace `sendPacket(Protocol.setCustomValue(...)).catch()` with the new debounced `syncLightValue`.

- [ ] **Step 3: Build verification**

Run: `pnpm check` and `pnpm build`
Expected: Clean compilation.

- [ ] **Step 4: Commit**

```bash
git add src/ui/lighting/LightingPanel.svelte
git commit -m "perf(lighting): debounce BLE packets to prevent queue overflow"
```

### Task 3: Layout Options as Raw Flags

**Files:**
- Modify: `src/ui/layout/LayoutOptions.svelte`

**Interfaces:**
- Produces: Accurate raw hex flag toggling with awaited `sendViaCommand`.

- [ ] **Step 1: Convert `LayoutOptions` to safe Acknowledged Write**

```svelte
<script lang="ts">
  import { getLayoutOptions, setLayoutOptions, markDirty } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';
  import { toast } from '../shared/Toast.svelte';

  const layoutOpts = $derived(getLayoutOptions());

  async function toggleBit(bit: number) {
    if (layoutOpts === null) return;
    const current = layoutOpts;
    const next = current ^ (1 << bit);
    
    try {
      await sendViaCommand(Protocol.setLayoutOptions(next));
      setLayoutOptions(next);
      markDirty();
    } catch (err) {
      toast('Failed to update layout', 'error');
    }
  }
</script>
```

- [ ] **Step 2: Typecheck**

Run: `pnpm check`
Expected: Passes.

- [ ] **Step 3: Commit**

```bash
git add src/ui/layout/LayoutOptions.svelte
git commit -m "feat(layout): use acknowledged commands for raw layout flags"
```

### Task 4: Explicit Unsupported Capabilities Guards

**Files:**
- Modify: `src/ui/encoder/EncoderEditor.svelte`
- Modify: `src/ui/lighting/LightingPanel.svelte`
- Modify: `src/ui/layout/LayoutOptions.svelte`
- Modify: `src/ui/macro/MacroEditor.svelte`

**Interfaces:**
- Consumes: The `null` state values in `$state` store.
- Produces: Empty/Unsupported placeholder states if the device didn't provide that capability during Sync.

- [ ] **Step 1: Wrap active UI components with checks**

```svelte
<!-- Example for LightingPanel.svelte -->
{#if getLighting().brightness === null}
  <div class="p-8 text-center text-text-muted">
    <p>Lighting configuration is not supported or not loaded for this device.</p>
  </div>
{:else}
  <!-- Existing sliders -->
{/if}
```

Do this for Encoders, Layout Options, and Macros (macros already mostly read-only, ensure text reflects uneditable memory viewer).

- [ ] **Step 2: Typecheck**

Run: `pnpm check`
Expected: Passes.

- [ ] **Step 3: Commit**

```bash
git add src/ui/encoder/EncoderEditor.svelte src/ui/lighting/LightingPanel.svelte src/ui/layout/LayoutOptions.svelte src/ui/macro/MacroEditor.svelte
git commit -m "feat(ui): explicitly hide editors for unsupported device capabilities"
```