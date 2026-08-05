# AirVIA Phase 2: Product Shell and Local Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Dark Control Surface UI, a local draft/profile schema, export/import functionality, and consistent persistent error states.

**Architecture:** Use Tailwind CSS to apply the "calibrated instrument/dark control surface" tokens. Profiles will be stored as plain-object JSON strings and saved/loaded via native `FileReader`/`Blob` APIs. Persistent errors will use an integrated banner.

**Tech Stack:** Svelte 5, TypeScript, Vite, Tailwind CSS v4, vitest.

## Global Constraints

- Initial public support: three to five hardware-verified keyboards.
- Local-first; no backend, accounts, analytics, telemetry, or cloud sync.
- No new dependency for queueing, storage, dialogs, icons, or styling.
- Device writes require loaded definition, verified compatibility, connected transport, and successful synchronization.
- Unsupported features render read-only or unavailable, never fabricated editable values.
- Preserve existing user changes; do not revert unrelated worktree changes.
- Run `pnpm check`, `pnpm test`, and `pnpm build` at every phase boundary.

---

### Task 1: Dark Control Surface CSS Tokens

**Files:**
- Modify: `src/app.css`
- Modify: `tailwind.config.js` (or remove if Tailwind v4 standalone logic suffices, but modifying base variables in `app.css` is safer).

**Interfaces:**
- Produces: Global CSS variables mapped to the Dark Control Surface spec (`#080b12` bg, `#111927` surface, cyan/lime/amber/red/violet accents).

- [ ] **Step 1: Write variables in `src/app.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg-dark: #080b12;
  --color-surface-dark: #111927;
  --color-surface-raised: #172235;
  --color-text-primary: #eef4ff;
  --color-text-muted: #8393a8;
  --color-accent-cyan: #38d8e3;
  --color-accent-lime: #a3e635;
  --color-accent-amber: #f5b942;
  --color-accent-red: #fb5b62;
  --color-accent-violet: #a78bfa;
}

body {
  background-color: var(--color-bg-dark);
  color: var(--color-text-primary);
}
```
*(Tailwind v4 uses `@theme` variables block)*

- [ ] **Step 2: Run build to verify Tailwind v4 compiles it**

Run: `pnpm build`
Expected: Passes.

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "style(theme): implement Dark Control Surface color tokens"
```

### Task 2: Profile Schema and Serialization

**Files:**
- Create: `src/store/profile.ts`
- Create: `src/store/profile.test.ts`

**Interfaces:**
- Produces: 
  `export type KeyboardProfile = { version: number; name: string; timestamp: number; keymap: number[]; encoders?: number[]; }`
  `export function serializeProfile(profile: KeyboardProfile): string`
  `export function parseProfile(input: string): KeyboardProfile`

- [ ] **Step 1: Write the failing tests in `src/store/profile.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { serializeProfile, parseProfile, type KeyboardProfile } from './profile';

describe('Profile Serialization', () => {
  it('round-trips a valid profile', () => {
    const p: KeyboardProfile = { version: 1, name: 'Test', timestamp: 1234, keymap: [1, 2, 3] };
    const s = serializeProfile(p);
    const p2 = parseProfile(s);
    expect(p2).toEqual(p);
  });
  
  it('rejects invalid JSON', () => {
    expect(() => parseProfile('not json')).toThrow('Invalid profile data');
  });

  it('rejects profile without version', () => {
    expect(() => parseProfile('{}')).toThrow('Unsupported profile version');
  });
});
```

- [ ] **Step 2: Run tests (Should fail)**

Run: `pnpm vitest run src/store/profile.test.ts`
Expected: Fail.

- [ ] **Step 3: Implement serialization logic in `src/store/profile.ts`**

```typescript
export type KeyboardProfile = {
  version: number;
  name: string;
  timestamp: number;
  keymap: number[];
  encoders?: number[];
  lighting?: { brightness: number; effect: number; speed: number; hue: number; saturation: number };
  layoutOptions?: number;
};

export function serializeProfile(profile: KeyboardProfile): string {
  return JSON.stringify(profile, null, 2);
}

export function parseProfile(input: string): KeyboardProfile {
  try {
    const data = JSON.parse(input);
    if (!data || typeof data !== 'object') throw new Error('Invalid profile data');
    if (data.version !== 1) throw new Error('Unsupported profile version');
    if (!Array.isArray(data.keymap)) throw new Error('Invalid keymap array');
    return data as KeyboardProfile;
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== 'Unexpected token o in JSON at position 1') throw err;
    throw new Error('Invalid profile data');
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/store/profile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/profile.ts src/store/profile.test.ts
git commit -m "feat(profile): implement local profile schema and serialization"
```

### Task 3: Profile Export and Import Handlers

**Files:**
- Modify: `src/store/profile.ts`
- Modify: `src/store/profile.test.ts`

**Interfaces:**
- Produces: 
  `export function exportProfileBlob(profile: KeyboardProfile): Blob`

- [ ] **Step 1: Write test for Blob creation**

```typescript
// Add to profile.test.ts
  it('creates an exportable Blob', () => {
    const p: KeyboardProfile = { version: 1, name: 'Test', timestamp: 1234, keymap: [1, 2, 3] };
    const blob = exportProfileBlob(p);
    expect(blob.type).toBe('application/json');
  });
```

- [ ] **Step 2: Implement Blob creation in `src/store/profile.ts`**

```typescript
export function exportProfileBlob(profile: KeyboardProfile): Blob {
  const data = serializeProfile(profile);
  return new Blob([data], { type: 'application/json' });
}
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run src/store/profile.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/store/profile.ts src/store/profile.test.ts
git commit -m "feat(profile): implement JSON Blob export functionality"
```

### Task 4: UI Shell Integration (Navigation and Workspace layout)

**Files:**
- Modify: `src/App.svelte`
- Modify: `src/ui/TabBar.svelte`
- Modify: `src/ui/ConnectBar.svelte`

**Interfaces:**
- Consumes: Tailwind classes from `app.css`.
- Produces: Updated navigation layout (desktop left-rail/mobile bottom-nav) structure using the dark tokens.

- [ ] **Step 1: Update structural layout in `App.svelte`**

```svelte
<!-- Example modification for App.svelte root wrapper -->
<div class="h-[100dvh] flex flex-col md:flex-row bg-bg-dark text-text-primary" ...>
  <!-- Sidebar for Desktop, Top for mobile -->
  <aside class="w-full md:w-64 bg-surface-dark border-r border-surface-raised flex flex-col">
    <ConnectBar onConnect={handleConnect} onDisconnect={handleDisconnect} />
    <TabBar />
  </aside>
  <!-- Main Editor Area -->
  <main class="flex-1 flex flex-col min-w-0">
    <!-- Active Editor Content -->
  </main>
</div>
```

- [ ] **Step 2: Update `TabBar.svelte` styling**

Update tabs to use `text-text-muted hover:text-text-primary`, and active state to use `text-accent-cyan`.

- [ ] **Step 3: Run Build**

Run: `pnpm build`
Expected: Passes. CSS structural layout successfully parsed.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte src/ui/TabBar.svelte src/ui/ConnectBar.svelte
git commit -m "style(ui): apply dark control surface tokens and sidebar layout"
```

### Task 5: Profile Management UI (Import/Export buttons)

**Files:**
- Create: `src/ui/profile/ProfileManager.svelte`
- Modify: `src/App.svelte`

**Interfaces:**
- Consumes: `exportProfileBlob`, `parseProfile`
- Produces: A surface (accessible via a secondary tab or sidebar bottom) to save the current store state to a file, and load a file into the store state.

- [ ] **Step 1: Implement `ProfileManager.svelte`**

```svelte
<script lang="ts">
  import { exportProfileBlob, parseProfile, type KeyboardProfile } from '../../store/profile';
  import { getKeymap, getDeviceName, setKeymap } from '../../store/app.svelte';
  import { toast } from '../shared/Toast.svelte';

  function handleExport() {
    const profile: KeyboardProfile = {
      version: 1,
      name: getDeviceName() || 'Backup',
      timestamp: Date.now(),
      keymap: getKeymap()
    };
    const blob = exportProfileBlob(profile);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airvia-${profile.name}-${profile.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const profile = parseProfile(reader.result as string);
        setKeymap(profile.keymap);
        toast('Profile imported', 'success');
      } catch (err: any) {
        toast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
</script>

<div class="p-4 border-t border-surface-raised flex gap-2">
  <button onclick={handleExport} class="px-3 py-1 bg-surface-raised hover:bg-slate-700 text-sm rounded">Export</button>
  <label class="px-3 py-1 bg-surface-raised hover:bg-slate-700 text-sm rounded cursor-pointer">
    Import
    <input type="file" accept=".json" onchange={handleImport} class="hidden" />
  </label>
</div>
```

- [ ] **Step 2: Add to `App.svelte`**

Include `<ProfileManager />` at the bottom of the sidebar.

- [ ] **Step 3: Run Typecheck**

Run: `pnpm check`
Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/profile/ProfileManager.svelte src/App.svelte
git commit -m "feat(profile): add UI controls for export and import of local profiles"
```