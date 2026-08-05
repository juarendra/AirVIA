<script lang="ts">
  let { onLoad }: { onLoad: () => void } = $props();
</script>

<div class="flex-1 flex items-center justify-center p-8">
  <div class="max-w-md w-full bg-surface-dark border border-surface-raised rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
    <div class="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 text-accent-cyan">
        <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
      </svg>
    </div>

    <h2 class="text-xl font-bold text-text-primary">Load V3 definition</h2>

    <p class="text-sm text-text-muted text-center leading-relaxed">
      Drop a <code class="px-1.5 py-0.5 rounded bg-surface-elevated text-accent-cyan text-xs font-mono">.json</code> definition file exported from
      <code class="px-1.5 py-0.5 rounded bg-surface-elevated text-accent-amber text-xs font-mono">VIA → SAVE + LOAD → Download</code>
      to configure your keyboard.
    </p>

    <button onclick={onLoad}
      class="px-6 py-2.5 bg-accent-cyan text-bg-dark rounded-xl text-sm font-semibold hover:bg-opacity-90 active:scale-95 transition-all">
      Load definition JSON
    </button>

    <p class="text-xs text-text-dimmed">
      No definition yet? Check the
      <button onclick={() => window.dispatchEvent(new CustomEvent('airvia-navigate', { detail: 'manual' }))}
        class="text-accent-violet hover:underline">
        Manual Pengguna
      </button>
      for setup instructions.
    </p>
  </div>
</div>
