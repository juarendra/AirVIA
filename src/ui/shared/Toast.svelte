<script module lang="ts">
  type ToastItem = { id: number; message: string; type: 'info' | 'success' | 'error' };

  let toasts = $state<ToastItem[]>([]);
  let next = 0;

  export function toast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = ++next;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 3000);
  }
</script>

{#if toasts.length > 0}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {#each toasts as t (t.id)}
      <div
        role={t.type === 'error' ? 'alert' : 'status'}
        class="px-4 py-2 rounded-xl text-sm shadow-lg border
          {t.type === 'success'
            ? 'bg-accent-lime/20 text-accent-lime border-accent-lime/30'
            : t.type === 'error'
              ? 'bg-accent-red/20 text-accent-red border-accent-red/30'
              : 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'}"
      >
        {t.message}
      </div>
    {/each}
  </div>
{/if}
