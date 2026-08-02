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
        class="px-4 py-2 rounded-lg text-white text-sm shadow-lg {t.type === 'success'
          ? 'bg-green-600'
          : t.type === 'error'
            ? 'bg-red-600'
            : 'bg-blue-600'}"
      >
        {t.message}
      </div>
    {/each}
  </div>
{/if}
