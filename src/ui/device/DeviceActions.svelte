<script lang="ts">
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';

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
  <h2 class="text-sm font-semibold text-slate-500 mb-3">Device Actions</h2>

  <div class="space-y-2">
    {#if !confirmReset}
      <button onclick={() => confirmReset = true}
        class="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
        Reset Keymap to Defaults
      </button>
    {:else}
      <div class="p-3 border border-red-200 rounded-xl bg-red-50">
        <p class="text-sm text-red-700 mb-2">This will reset ALL keymaps and encoder maps to defaults. This cannot be undone.</p>
        <div class="flex gap-2">
          <button onclick={handleResetKeymap} disabled={resetting}
            class="px-4 py-2 bg-red-600 text-white rounded-full text-sm">
            {resetting ? 'Resetting...' : 'Confirm Reset'}
          </button>
          <button onclick={() => confirmReset = false}
            class="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-sm">
            Cancel
          </button>
        </div>
      </div>
    {/if}

    {#if resetDone}
      <p class="text-sm text-slate-600">{resetDone}</p>
    {/if}
  </div>
</div>
