<script lang="ts">
  import { getLayerCount, getActiveLayer, setActiveLayer } from '../../store/app.svelte';

  const layerCount = $derived(getLayerCount());
  const active = $derived(getActiveLayer());

  const layers = $derived(Array.from({ length: layerCount }, (_, i) => i));
</script>

<div class="bg-gray-900 border-b border-gray-700 px-3 py-1.5 flex items-center gap-1">
  {#each layers as layer (layer)}
    <button
      onclick={() => setActiveLayer(layer)}
      class="px-3 py-1 text-xs font-medium rounded transition-colors
             {active === layer
               ? 'bg-blue-600 text-white'
               : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
    >
      L{layer}
    </button>
  {/each}
</div>
