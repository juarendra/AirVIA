<script lang="ts">
  import { getMacroCount, getMacroBytes, getMacroBuffer } from '../../store/app.svelte';

  let selectedSlot = $state(0);

  const count = $derived(getMacroCount() ?? 0);
  const totalBytes = $derived(getMacroBytes() ?? 0);
  const buffer = $derived(getMacroBuffer() ?? []);

  // Check if buffer is QMK text format (0x00 separated strings)
  const isQmkText = $derived(buffer.length > 0 && buffer[0] === 0x00 && buffer[buffer.length - 1] === 0x00);
  
  // Extract macro strings if it's QMK text format
  const macroStrings = $derived.by(() => {
    if (!isQmkText || count === 0) return [];
    
    const strings: string[] = [];
    let current = '';
    
    // Start from index 1 (skip first null)
    for (let i = 1; i < buffer.length; i++) {
      if (buffer[i] === 0x00) {
        if (strings.length < count) {
          strings.push(current);
        }
        current = '';
      } else {
        current += String.fromCharCode(buffer[i]);
      }
    }
    
    return strings;
  });

  let editContent = $state('');
  let isEditing = $state(false);

  $effect(() => {
    if (isQmkText && macroStrings.length > selectedSlot && !isEditing) {
      editContent = macroStrings[selectedSlot];
    }
  });

  import { markSaved } from '../../store/app.svelte';
  import { sendViaCommand } from '../../ble/dispatch';
  import { Protocol } from '../../core/protocol';

  async function saveMacro() {
    if (!isQmkText) return;
    
    const newStrings = [...macroStrings];
    newStrings[selectedSlot] = editContent;
    
    // Build new buffer
    const newBuffer = [0x00];
    for (const str of newStrings) {
      for (let i = 0; i < str.length; i++) {
        newBuffer.push(str.charCodeAt(i));
      }
      newBuffer.push(0x00);
    }
    
    if (newBuffer.length > totalBytes) {
      alert(`Macro too long. Maximum ${totalBytes} bytes.`);
      return;
    }
    
    // Pad with 0x00
    while (newBuffer.length < totalBytes) {
      newBuffer.push(0x00);
    }
    
    // Send chunked writes
    for (let offset = 0; offset < totalBytes; offset += 28) {
      const chunkSize = Math.min(28, totalBytes - offset);
      const chunk = newBuffer.slice(offset, offset + chunkSize);
      await sendViaCommand(Protocol.setMacroBuffer(offset, chunk));
    }
    
    // Update local state (this is a simplified approach, ideally we should update the store or re-sync)
    // ponytail: simplified local state update, full re-sync not needed for simple text edit
    buffer.splice(0, buffer.length, ...newBuffer);
    isEditing = false;
    markSaved();
  }

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

    <div class="text-xs text-slate-400 font-mono flex justify-between items-center">
      <span>M{selectedSlot} offset: {offset} size: {size}</span>
      {#if isQmkText}
        {#if isEditing}
          <div class="flex gap-2">
            <button class="px-2 py-1 bg-slate-200 rounded text-slate-700 hover:bg-slate-300" onclick={() => isEditing = false}>Cancel</button>
            <button class="px-2 py-1 bg-blue-600 rounded text-white hover:bg-blue-700" onclick={saveMacro}>Save</button>
          </div>
        {:else}
          <button class="px-2 py-1 bg-slate-200 rounded text-slate-700 hover:bg-slate-300" onclick={() => { isEditing = true; editContent = macroStrings[selectedSlot] || ''; }}>Edit</button>
        {/if}
      {/if}
    </div>

    {#if isQmkText}
      <div class="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        {#if isEditing}
          <textarea
            class="flex-1 p-3 font-mono text-sm resize-none outline-none"
            bind:value={editContent}
            placeholder="Enter macro string..."
          ></textarea>
        {:else}
          <div class="flex-1 p-3 font-mono text-sm overflow-auto whitespace-pre-wrap">
            {macroStrings[selectedSlot] || '(Empty)'}
          </div>
        {/if}
      </div>
    {:else}
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
  {/if}
</div>
