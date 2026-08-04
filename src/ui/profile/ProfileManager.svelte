<script lang="ts">
  import { exportProfileBlob, parseProfile, type KeyboardProfile } from '../../store/profile';
  import { getKeymap, getDeviceName, getDefinition, getEncoderCount, getEncoderMap, getLighting, getLayoutOptions } from '../../store/app.svelte';
  import { toast } from '../shared/Toast.svelte';
  import ProfileApplier from './ProfileApplier.svelte';

  let pendingProfile = $state<KeyboardProfile | null>(null);

  function handleExport() {
    const profile: KeyboardProfile = {
      version: 1,
      name: getDeviceName() || 'Backup',
      timestamp: Date.now(),
      keymap: getKeymap(),
      encoders: getEncoderCount() > 0 ? (getEncoderMap() || undefined) : undefined,
      lighting: getLighting() || undefined,
      layoutOptions: getLayoutOptions() ?? undefined
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
    reader.onload = (ev) => {
        try {
            const data = ev.target?.result as string;
            pendingProfile = parseProfile(data);
        } catch (err) {
            toast('Failed to load profile', 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
  }
</script>

<div class="p-4 border-t border-surface-raised flex gap-2">
  <button onclick={handleExport} class="px-3 py-1 bg-surface-raised hover:bg-surface-elevated text-sm rounded">Export</button>
  <label class="px-3 py-1 bg-surface-raised hover:bg-surface-elevated text-sm rounded cursor-pointer">
    Import
    <input type="file" accept=".json" onchange={handleImport} class="hidden" />
  </label>
</div>

{#if pendingProfile}
  <ProfileApplier profile={pendingProfile} onclose={() => pendingProfile = null} />
{/if}
