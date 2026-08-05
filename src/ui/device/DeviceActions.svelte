<script lang="ts">
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';

  let { onReplaceDefinition }: { onReplaceDefinition?: () => void } = $props();

  let confirmReset = $state(false);
  let resetting = $state(false);
  let resetDone = $state('');

  async function handleResetKeymap() {
    resetting = true;
    try {
      await sendViaCommand(Protocol.resetKeymap());
      resetDone = 'Keymap reset to defaults. Reconnect to see changes.';
    } catch {
      resetDone = 'Reset failed';
    }
    resetting = false;
    confirmReset = false;
  }
</script>

<div class="p-4">
  <h2 class="text-sm font-semibold text-text-muted mb-3">Device Actions</h2>

  <div class="space-y-2">
    {#if onReplaceDefinition}
      <button onclick={onReplaceDefinition}
        class="w-full text-left px-4 py-3 bg-surface-dark border border-surface-raised rounded-xl text-sm text-accent-cyan hover:bg-surface-raised transition-colors">
        Replace definition
      </button>
    {/if}

    {#if !confirmReset}
      <button onclick={() => confirmReset = true}
        class="w-full text-left px-4 py-3 bg-surface-dark border border-surface-raised rounded-xl text-sm text-accent-red hover:bg-accent-red/10 transition-colors">
        Reset Keymap to Defaults
      </button>
    {:else}
      <div class="p-3 border border-accent-red/30 rounded-xl bg-accent-red/10">
        <p class="text-sm text-accent-red mb-2">This will reset ALL keymaps and encoder maps to defaults. This cannot be undone.</p>
        <div class="flex gap-2">
          <button onclick={handleResetKeymap} disabled={resetting}
            class="px-4 py-2 bg-accent-red text-white rounded-full text-sm">
            {resetting ? 'Resetting...' : 'Confirm Reset'}
          </button>
          <button onclick={() => confirmReset = false}
            class="px-4 py-2 bg-surface-raised text-text-muted rounded-full text-sm">
            Cancel
          </button>
        </div>
      </div>
    {/if}

    {#if resetDone}
      <p class="text-sm text-text-muted">{resetDone}</p>
    {/if}
  </div>
</div>
