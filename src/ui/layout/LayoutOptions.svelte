<script lang="ts">
  import { getLayoutOptions, setLayoutOptions } from '../../store/app.svelte';
  import { Protocol } from '../../core/protocol';
  import { sendPacket } from '../../ble/dispatch';

  const options = $derived(getLayoutOptions());
  const hex = $derived('0x' + options.toString(16).padStart(8, '0').toUpperCase());

  function toggle(bit: number) {
    const next = options ^ (1 << bit);
    setLayoutOptions(next);
    sendPacket(Protocol.setLayoutOptions(next));
  }
</script>

<div class="bg-gray-800 rounded p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-gray-300">Layout Options</h3>
    <code class="text-xs text-blue-400 bg-gray-900 px-2 py-0.5 rounded">{hex}</code>
  </div>
  <div class="grid grid-cols-4 gap-2">
    {#each Array.from({ length: 16 }, (_, i) => i) as i}
      <label class="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer hover:text-gray-200 transition-colors select-none">
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
</div>
