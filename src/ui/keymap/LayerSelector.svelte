<script lang="ts">
  import { getLayerCount, getActiveLayer, setActiveLayer } from '../../store/app.svelte';

  const layerCount = $derived(getLayerCount());
  const active = $derived(getActiveLayer());

  const layers = $derived(Array.from({ length: layerCount }, (_, i) => i));
</script>

<div class="flex items-center gap-1">
  {#each layers as layer (layer)}
    <button
      aria-pressed={active === layer}
      onclick={() => setActiveLayer(layer)}
      class="rounded-full px-3 py-1 text-xs font-medium transition-colors
             {active === layer
               ? 'bg-accent-cyan text-bg-dark shadow-sm'
               : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'}"
    >
      L{layer}
    </button>
  {/each}
</div>
