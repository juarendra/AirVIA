<script lang="ts">
  import { getLayerCount, getActiveLayer, setActiveLayer } from '../../store/app.svelte';

  const layerCount = $derived(getLayerCount());
  const active = $derived(getActiveLayer());

  const layers = $derived(Array.from({ length: layerCount }, (_, i) => i));
</script>

<div class="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center gap-1">
  {#each layers as layer (layer)}
    <button
      aria-pressed={active === layer}
      onclick={() => setActiveLayer(layer)}
      class="rounded-full px-3 py-1 text-xs font-medium transition-colors
             {active === layer
               ? 'bg-blue-600 text-white shadow-sm'
               : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}"
    >
      L{layer}
    </button>
  {/each}
</div>
