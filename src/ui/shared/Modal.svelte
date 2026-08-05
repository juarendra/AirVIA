<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';

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

  let dialog: HTMLDivElement | undefined = $state();
  let previousFocus: HTMLElement | null = null;

  $effect(() => {
    if (show) {
      previousFocus = document.activeElement as HTMLElement;
      tick().then(() => {
        dialog?.focus();
      });
    } else {
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
    }
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && show) onclose(); }} />
{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#060912]/60" onclick={onclose} role="presentation">
    <div
      bind:this={dialog}
      class="bg-[var(--air-base)] border border-[#1f3554] rounded-[var(--air-radius-lg)] shadow-lg shadow-black/30 max-h-[80vh] overflow-y-auto w-full max-w-lg mx-4 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      onkeydown={handleKeyDown}
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between p-4 border-b border-[#1f3554]">
        <h2 id="modal-title" class="text-lg font-semibold text-[var(--air-text-primary)]">{title}</h2>
        <button onclick={onclose} aria-label="Close dialog" class="text-[var(--air-text-dimmed)] hover:text-[var(--air-text-primary)] rounded-full hover:bg-[var(--air-surface)] w-8 h-8 flex items-center justify-center text-xl leading-none">&times;</button>
      </div>
      <div class="p-4">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
