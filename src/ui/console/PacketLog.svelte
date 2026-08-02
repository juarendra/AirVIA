<script lang="ts">
  import { getPacketLog } from '../../store/app.svelte';

  const log = $derived(getPacketLog());

  function hex8(bytes: number[]): string {
    return bytes.slice(0, 8).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }

  const reversed = $derived([...log].reverse());
</script>

<div class="flex flex-col h-full bg-white">
  <div class="flex-1 overflow-y-auto p-3 font-mono text-sm bg-slate-50 rounded-xl m-3">
    {#if reversed.length === 0}
      <p class="text-slate-400 text-center mt-8">No packets yet. Connect to a device to see traffic.</p>
    {:else}
      {#each reversed as entry}
        <div class="flex gap-3 py-0.5 border-b border-slate-100 last:border-b-0">
          <span class="{entry.dir === 'tx' ? 'text-blue-600' : 'text-emerald-600'} w-6 font-bold text-xs">
            {entry.dir.toUpperCase()}
          </span>
          <span class="text-slate-600">{hex8(entry.packet)}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
