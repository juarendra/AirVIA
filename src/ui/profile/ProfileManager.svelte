<script lang="ts">
  import { exportProfileBlob, parseProfile, type KeyboardProfile } from '../../store/profile';
  import { getKeymap, getDeviceName, getDefinition, getEncoderCount, getEncoderMap, getLighting, getLayoutOptions } from '../../store/app.svelte';
  import { toast } from '../shared/Toast.svelte';
  import ProfileApplier from './ProfileApplier.svelte';

  let pendingProfile = $state<KeyboardProfile | null>(null);

  const deviceName = $derived(getDeviceName() || 'No device');

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

<div class="flex flex-col h-full p-4 gap-6 overflow-y-auto">
  <section class="bg-surface-dark border border-surface-raised rounded-xl p-4 space-y-3">
    <h2 class="text-sm font-semibold text-text-muted">Current Backup</h2>
    <div class="flex items-center justify-between">
      <span class="text-text-primary font-medium">{deviceName}</span>
    </div>
    <p class="text-xs text-text-dimmed">
      Export saves complete current keyboard state — keymap, encoders, lighting, layout options.
    </p>
  </section>

  <section class="flex gap-3">
    <button onclick={handleExport} class="flex-1 px-4 py-3 bg-accent-cyan text-bg-dark text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
      Export
    </button>
    <label class="flex-1">
      <span class="block px-4 py-3 bg-surface-raised text-text-primary text-sm font-medium rounded-xl text-center cursor-pointer hover:bg-surface-elevated transition-colors">
        Import
      </span>
      <input type="file" accept=".json" onchange={handleImport} class="hidden" />
    </label>
  </section>

  <div class="text-xs text-text-dimmed text-center">
    Profiles are compatible across firmware versions. Encoder and lighting data preserved when device supports them.
  </div>

  <section class="bg-surface-dark border border-surface-raised rounded-xl p-4">
    <h3 class="text-sm font-semibold text-text-muted mb-3">Apply Stored Profile</h3>
    {#if !pendingProfile}
      <p class="text-sm text-text-dimmed">Import a profile above to apply it to the connected device.</p>
    {/if}
  </section>
</div>

{#if pendingProfile}
  <ProfileApplier profile={pendingProfile} onclose={() => pendingProfile = null} />
{/if}
