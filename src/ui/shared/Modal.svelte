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

{#if show}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onclick={onclose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-[80vh] overflow-y-auto w-full max-w-lg mx-4"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 class="text-lg font-semibold text-gray-100">{title}</h2>
        <button onclick={onclose} class="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
      </div>
      <div class="p-4">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
