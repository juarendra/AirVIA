<script lang="ts">
  let { message, onDismiss }: { message: string; onDismiss?: () => void } = $props();
</script>

{#if message}
  <div class="px-4 py-3 bg-red-50 border-b border-red-200 text-sm text-red-700 flex items-center justify-between">
    <span>{message}</span>
    {#if onDismiss}
      <button onclick={onDismiss} class="text-red-400 hover:text-red-600" aria-label="Dismiss">✕</button>
    {/if}
  </div>
{/if}
