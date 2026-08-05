<script lang="ts">
  import { getEncoderCount, getEncoderMap, getEncoderKeycode, getActiveLayer, getSelectedTarget, setSelectedTarget } from '../../store/app.svelte';
  import { keycodeLabel } from '../../core/keycodes';

  const encoderCount = $derived(getEncoderCount());
  const activeLayer = $derived(getActiveLayer());
  const available = $derived(getEncoderMap() !== null);
  const selected = $derived(getSelectedTarget());

  function openPicker(enc: number, cw: boolean) {
    setSelectedTarget({ type: 'encoder', layer: activeLayer, id: enc, cw });
  }

  function cwLabel(enc: number): string {
    return keycodeLabel(getEncoderKeycode(activeLayer, enc, true));
  }

  function ccwLabel(enc: number): string {
    return keycodeLabel(getEncoderKeycode(activeLayer, enc, false));
  }
</script>

<div class="flex flex-col h-full p-4 gap-4 overflow-y-auto">
  <h3 class="text-sm font-semibold text-text-muted">Encoder Assignment — Layer {activeLayer}</h3>

  {#if getEncoderMap() === null}
    <div class="flex-1 flex items-center justify-center p-8 text-text-dimmed text-sm italic">
      <p>Configuration is not supported or not loaded for this device</p>
    </div>
  {:else if encoderCount === 0}
    <p class="text-text-dimmed text-sm italic p-4">No encoders defined in V3 definition</p>
  {:else}
    <div class="space-y-3">
      {#each Array(encoderCount) as _, enc (enc)}
        <div class="bg-surface-dark border border-surface-raised rounded-xl p-3">
          <div class="text-sm font-medium text-text-muted mb-2">Encoder {enc}</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => openPicker(enc, true)}
              class="flex flex-col items-start gap-1 p-3 bg-surface-dark hover:bg-surface-raised rounded-lg border border-surface-raised transition-colors text-left
                     {selected?.type === 'encoder' && selected.id === enc && selected.cw ? 'ring-2 ring-accent-cyan' : ''}"
            >
              <span class="text-xs text-text-dimmed">CW</span>
              <span class="text-sm text-text-primary font-mono">{cwLabel(enc)}</span>
            </button>
            <button
              onclick={() => openPicker(enc, false)}
              class="flex flex-col items-start gap-1 p-3 bg-surface-dark hover:bg-surface-raised rounded-lg border border-surface-raised transition-colors text-left
                     {selected?.type === 'encoder' && selected.id === enc && !selected.cw ? 'ring-2 ring-accent-cyan' : ''}"
            >
              <span class="text-xs text-text-dimmed">CCW</span>
              <span class="text-sm text-text-primary font-mono">{ccwLabel(enc)}</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
