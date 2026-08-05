<script lang="ts">
  import { getPacketLog } from '../../store/app.svelte';

  const log = $derived(getPacketLog());

  function hex8(bytes: number[]): string {
    return bytes.slice(0, 8).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }

  const reversed = $derived([...log].reverse());
</script>

<div class="flex flex-col h-full">
  <div class="flex-1 overflow-y-auto p-3 font-mono text-sm bg-surface-dark rounded-xl m-3 border border-surface-raised">
    {#if reversed.length === 0}
      <p class="text-text-dimmed text-center mt-8">No packets yet. Connect to a device to see traffic.</p>
    {:else}
      {#each reversed as entry}
        <div class="flex gap-3 py-0.5 border-b border-surface-raised last:border-b-0">
          <span class="
            {entry.dir === 'tx' ? 'text-accent-cyan' : 'text-accent-lime'} w-6 font-bold text-xs">
            {entry.dir.toUpperCase()}
          </span>
          <span class="text-text-muted font-mono">{hex8(entry.packet)}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
