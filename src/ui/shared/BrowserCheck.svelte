<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  function openManual() {
    window.dispatchEvent(new CustomEvent('airvia-navigate', { detail: 'manual' }));
  }

  const ok = $derived(typeof navigator !== 'undefined' && 'bluetooth' in navigator && window.isSecureContext);
</script>

{@render children()}

{#if !ok}
  <div class="fixed bottom-0 left-0 right-0 z-50 px-4 py-2 bg-accent-amber/15 border-t border-accent-amber/20 text-xs text-accent-amber text-center">
    Bluetooth not available — connection features require Chrome 122+ or Edge 122+ with Bluetooth enabled.
    <button onclick={openManual} class="underline ml-1">See manual</button>
  </div>
{/if}
