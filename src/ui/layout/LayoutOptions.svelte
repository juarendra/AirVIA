<script lang="ts">
  import { getLayoutOptions, setLayoutOptions, markDirty } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';
  import { toast } from '../shared/Toast.svelte';

  const options = $derived(getLayoutOptions() ?? 0);
  const hex = $derived('0x' + options.toString(16).padStart(8, '0').toUpperCase());

  async function toggle(bit: number) {
    if (getLayoutOptions() === null) return;
    const next = options ^ (1 << bit);
    try {
      await sendViaCommand(Protocol.setLayoutOptions(next));
      setLayoutOptions(next);
      markDirty();
    } catch (err) {
      toast('Failed to update layout', 'error');
    }
  }
</script>

<div class="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-slate-600">Layout Options</h3>
    {#if getLayoutOptions() !== null}
      <code class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{hex}</code>
    {/if}
  </div>

  {#if getLayoutOptions() === null}
    <div class="p-8 text-center text-slate-400 text-sm italic">
      <p>Configuration is not supported or not loaded for this device</p>
    </div>
  {:else}
    <div class="grid grid-cols-4 gap-2">
      {#each Array.from({ length: 16 }, (_, i) => i) as i}
        <label class="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors select-none">
          <input
            type="checkbox"
            checked={!!(options & (1 << i))}
            onchange={() => toggle(i)}
            class="accent-blue-500 rounded cursor-pointer"
          />
          Option {i}
        </label>
      {/each}
    </div>
  {/if}
</div>
