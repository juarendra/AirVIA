<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const ok = $derived(typeof navigator !== 'undefined' && 'bluetooth' in navigator && window.isSecureContext);
</script>

{#if ok}
  {@render children()}
{:else}
  <div class="flex items-center justify-center min-h-screen bg-slate-50">
    <div class="max-w-md text-center p-8">
      <h1 class="text-xl font-bold text-slate-700 mb-4">AirVIA</h1>
      <p class="text-slate-500 mb-4">This app requires Web Bluetooth API.</p>
      <ul class="text-sm text-slate-500 space-y-2 text-left mb-4">
        <li>✓ Chrome 122+ or Edge 122+</li>
        <li>✓ HTTPS or localhost</li>
        <li>✗ Firefox and Safari not supported</li>
      </ul>
      <p class="text-xs text-slate-400">Open in Chrome or Edge with Bluetooth enabled.</p>
    </div>
  </div>
{/if}
