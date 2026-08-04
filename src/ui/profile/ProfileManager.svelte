<script lang="ts">
  import { exportProfileBlob, parseProfile, type KeyboardProfile } from '../../store/profile';
  import { getKeymap, getDeviceName, setKeymap, getDefinition } from '../../store/app.svelte';
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
    toast('Profile import temporarily disabled until RC Phase 6.', 'error');
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
