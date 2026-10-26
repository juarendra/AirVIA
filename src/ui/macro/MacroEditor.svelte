<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getMacroCount, getMacroBytes, getMacroBuffer, getConnectionState, getSyncPhase, markSaveFailed } from '../../store/app.svelte';
  import { getTransport } from '../../ble/dispatch';
  import type { Transport } from '../../ble/transport';
  import { decodeMacroSlots, macroText, replaceMacroText } from '../../core/macros';
  import { saveMacroBuffer } from '../../device/macros';

  let selectedSlot = $state(0);
  let editContent = $state('');
  let isEditing = $state(false);
  let isSaving = $state(false);
  let error = $state('');
  let notice = $state('');
  let editingSession: Transport | null = null;
  let controller: AbortController | null = null;
  const count = $derived(getMacroCount() ?? 0);
  const buffer = $derived(getMacroBuffer() ?? []);
  const totalBytes = $derived(getMacroBytes() ?? 0);
  const ready = $derived(getConnectionState() === 'connected' && getSyncPhase() === 'ready');
  const parsed = $derived.by(() => {
    try { return { slots: decodeMacroSlots(buffer, count), error: '' }; }
    catch (error) { return { slots: [], error: error instanceof Error ? error.message : String(error) }; }
  });
  const slotBytes = $derived(parsed.slots[selectedSlot] ?? []);
  const text = $derived(macroText(slotBytes));

  $effect(() => {
    if (selectedSlot >= count) selectedSlot = 0;
    const connected = getConnectionState() === 'connected';
    const liveBuffer = getMacroBuffer();
    if (editingSession && (!connected || !liveBuffer || getTransport() !== editingSession)) {
      controller?.abort();
      controller = null;
      editingSession = null;
      isEditing = false;
      isSaving = false;
      error = '';
      notice = '';
    }
  });
  onDestroy(() => controller?.abort());

  async function saveMacro() {
    if (!ready || isSaving || !isEditing || getTransport() !== editingSession) return;
    error = '';
    notice = '';
    const operation = new AbortController();
    controller = operation;
    const session = editingSession;
    isSaving = true;
    try {
      const next = replaceMacroText(buffer, count, selectedSlot, editContent);
      await saveMacroBuffer(next, operation.signal);
      isEditing = false;
      notice = 'Committed and read back. Playback runs in VIA-Arduino firmware.';
    } catch (cause) {
      if (getTransport() === session) {
        error = `${cause instanceof Error ? cause.message : String(cause)}. Retry rewrites the complete buffer; displayed data is the last verified snapshot.`;
        markSaveFailed();
      }
    } finally {
      if (controller === operation) {
        controller = null;
        isSaving = false;
      }
    }
  }
</script>

<div class="flex flex-col h-full gap-3 p-4 overflow-y-auto">
  <div class="text-sm text-text-muted">{count} macros &middot; {totalBytes} bytes total</div>
  <p class="text-xs text-text-dimmed">Configuration only. VIA-Arduino executes macros on the keyboard without AirVIA running.</p>
  {#if error}<p role="alert" class="text-sm text-red-400">{error}</p>{/if}
  {#if notice}<p role="status" class="text-sm text-text-muted">{notice}</p>{/if}
  {#if getMacroCount() === null}
    <p class="text-text-dimmed text-sm italic">Macro configuration has not been loaded. Connect and synchronize first.</p>
  {:else if count === 0}
    <p class="text-text-dimmed text-sm italic">No macros defined in firmware</p>
  {:else if parsed.error}
    <p role="alert" class="text-sm text-red-400">{parsed.error}. Reconnect to read the device buffer again.</p>
  {:else}
    {#if !ready}<p role="status" class="text-sm text-text-dimmed">Last verified snapshot — read-only until reconnected.</p>{/if}
    {#if buffer[buffer.length - 1] !== 0}
      <p role="alert" class="text-sm text-red-400">The device upload is incomplete and firmware playback is disabled. Save a complete buffer to recover.</p>
    {/if}
    <div class="flex gap-1 flex-wrap">
      {#each Array(count) as _, index}
        <button disabled={isSaving} onclick={() => { selectedSlot = index; isEditing = false; error = ''; notice = ''; }}
          class="rounded-full px-3 py-1 text-xs font-mono transition-colors disabled:opacity-40 {index === selectedSlot ? 'bg-accent-cyan text-bg-dark' : 'bg-surface-raised text-text-muted hover:bg-surface-elevated'}">M{index}</button>
      {/each}
    </div>
    <div class="text-xs text-text-dimmed font-mono flex justify-between items-center">
      <span>M{selectedSlot} &middot; {slotBytes.length} bytes</span>
      {#if text !== null}
        {#if isEditing}
          <div class="flex gap-2">
            <button disabled={isSaving} class="px-2 py-1 bg-surface-raised rounded" onclick={() => isEditing = false}>Cancel</button>
            <button disabled={!ready || isSaving} class="px-2 py-1 bg-accent-cyan rounded text-bg-dark disabled:opacity-40" onclick={saveMacro}>{isSaving ? 'Saving...' : 'Save'}</button>
          </div>
        {:else}
          <button disabled={!ready} class="px-2 py-1 bg-surface-raised rounded disabled:opacity-40" onclick={() => { editingSession = getTransport(); editContent = text ?? ''; isEditing = true; error = ''; notice = ''; }}>Edit</button>
        {/if}
      {/if}
    </div>
    <div class="flex-1 bg-surface-dark border border-surface-raised rounded-xl overflow-hidden flex flex-col">
      {#if text === null}
        <p class="p-3 text-sm text-text-dimmed">Key sequence — read-only here; its bytes are preserved when another slot is edited.</p>
        <pre class="p-3 text-xs whitespace-pre-wrap">{slotBytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')}</pre>
      {:else if isEditing}
        <label class="sr-only" for="macro-text">Text for M{selectedSlot}</label>
        <textarea id="macro-text" disabled={isSaving || !ready} class="flex-1 p-3 font-mono text-sm resize-none outline-none bg-surface-dark text-text-primary" bind:value={editContent} placeholder="US ASCII text; tab and newline supported"></textarea>
      {:else}
        <div class="flex-1 p-3 font-mono text-sm whitespace-pre-wrap text-text-primary">{text || '(Empty)'}</div>
      {/if}
    </div>
    <p class="text-xs text-text-dimmed">Assign M{selectedSlot} in Keymap Editor. Text uses the host's US keyboard layout; no recorder or playback runs in this app.</p>
  {/if}
</div>
