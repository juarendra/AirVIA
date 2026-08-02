<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    show,
    title,
    onclose,
    children,
  }: {
    show: boolean;
    title: string;
    onclose: () => void;
    children?: Snippet;
  } = $props();
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show) onclose(); }} />
{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onclick={onclose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto w-full max-w-lg mx-4"
      role="dialog"
      aria-modal="true"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 class="text-lg font-semibold text-slate-800">{title}</h2>
        <button onclick={onclose} aria-label="Close dialog" class="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 w-8 h-8 flex items-center justify-center text-xl leading-none">&times;</button>
      </div>
      <div class="p-4">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
