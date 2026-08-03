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

<div class="p-4">
  <h3 class="text-base font-semibold text-slate-700 mb-3">Encoder Assignment — Layer {activeLayer}</h3>

  {#if !available}
    <p class="text-slate-400 text-sm italic">Encoders are not supported by this device</p>
  {:else if encoderCount === 0}
    <p class="text-slate-400 text-sm italic">No encoders defined in V3 definition</p>
  {:else}
    <div class="space-y-3">
      {#each Array(encoderCount) as _, enc (enc)}
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div class="text-sm font-medium text-slate-600 mb-2">Encoder {enc}</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => openPicker(enc, true)}
              class="flex flex-col items-start gap-1 p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left
                     {selected?.type === 'encoder' && selected.id === enc && selected.cw ? 'ring-2 ring-blue-500' : ''}"
            >
              <span class="text-xs text-slate-400">CW</span>
              <span class="text-sm text-slate-700 font-mono">{cwLabel(enc)}</span>
            </button>
            <button
              onclick={() => openPicker(enc, false)}
              class="flex flex-col items-start gap-1 p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left
                     {selected?.type === 'encoder' && selected.id === enc && !selected.cw ? 'ring-2 ring-blue-500' : ''}"
            >
              <span class="text-xs text-slate-400">CCW</span>
              <span class="text-sm text-slate-700 font-mono">{ccwLabel(enc)}</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
