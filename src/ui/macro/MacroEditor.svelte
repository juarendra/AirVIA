<script lang="ts">
  import { getMacroCount, getMacroBytes, getMacroBuffer } from '../../store/app.svelte';

  let selectedSlot = $state(0);

  const count = $derived(getMacroCount() ?? 0);
  const totalBytes = $derived(getMacroBytes() ?? 0);
  const buffer = $derived(getMacroBuffer() ?? []);

  function hexByte(b: number): string {
    return b.toString(16).padStart(2, '0').toUpperCase();
  }

  function slotRange(slotIndex: number): { offset: number; size: number } {
    if (count === 0) return { offset: 0, size: 0 };
    const perSlot = Math.floor(totalBytes / count);
    const offset = slotIndex * perSlot;
    const size = slotIndex < count - 1 ? perSlot : totalBytes - offset;
    return { offset, size };
  }

  const { offset, size } = $derived(slotRange(selectedSlot));
</script>

<div class="bg-white min-h-0 flex flex-col gap-3 p-4">
  <div class="text-sm text-slate-500">
    {count} macro{count !== 1 ? 's' : ''} &middot; {totalBytes} bytes total
  </div>

  {#if getMacroCount() === null}
    <div class="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-sm italic">
      <p>Configuration is not supported or not loaded for this device</p>
    </div>
  {:else if count === 0}
    <div class="flex-1 flex items-center justify-center">
      <p class="text-slate-400 text-sm">No macros defined in firmware</p>
    </div>
  {:else}
    <div class="flex gap-1 flex-wrap">
      {#each Array(count) as _, i}
        <button
          onclick={() => selectedSlot = i}
          class="rounded-full px-3 py-1 text-xs font-mono transition-colors
                 {i === selectedSlot
                   ? 'bg-blue-600 text-white shadow-sm'
                   : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}"
        >
          M{i}
        </button>
      {/each}
    </div>

    <div class="text-xs text-slate-400 font-mono">
      M{selectedSlot} offset: {offset} size: {size}
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs overflow-auto">
      <div class="grid grid-cols-[auto_repeat(8,1fr)] gap-x-3 gap-y-0.5 text-slate-500">
        {#each Array(Math.ceil(size / 8)) as _, row}
          {@const rowBytes = buffer.slice(offset + row * 8, offset + row * 8 + 8)}
          <span class="text-slate-300 select-none">{hexByte(offset + row * 8)}</span>
          {#each rowBytes as b}
            <span class="text-blue-600">{hexByte(b)}</span>
          {/each}
          {#each Array(8 - rowBytes.length) as _}
            <span></span>
          {/each}
        {/each}
      </div>
    </div>
  {/if}
</div>
