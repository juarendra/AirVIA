<script lang="ts">
  import { manualSections, searchManual, type ManualSection, type ManualBlock } from './manual-content.js';
  import { setActiveTab } from '../../store/app.svelte';
  import { getSyncPhase, getConnectionState } from '../../store/app.svelte';

  let query = $state('');
  let results = $derived(searchManual(query));

  function resetSearch() {
    query = '';
  }

  function renderBlock(block: ManualBlock) {
    if (block.type === 'paragraph') {
      return `<p>${block.text}</p>`;
    }
    if (block.type === 'steps') {
      return `<ol class="list-decimal list-inside space-y-1 text-sm text-text-primary">${block.items.map(i => `<li>${i}</li>`).join('')}</ol>`;
    }
    if (block.type === 'notes') {
      return `<ul class="list-disc list-inside space-y-1 text-sm text-text-muted">${block.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }
    if (block.type === 'warning') {
      return `<div class="bg-accent-amber/10 border-l-4 border-accent-amber p-3 rounded-r my-3"><div class="text-xs font-bold text-accent-amber uppercase mb-1">${block.title}</div><div class="text-sm text-text-primary">${block.text}</div></div>`;
    }
    if (block.type === 'statuses') {
      return `<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse"><thead><tr class="bg-surface-raised text-text-muted text-xs uppercase"><th class="p-2 text-left border-b border-surface-raised">Status</th><th class="p-2 text-left border-b border-surface-raised">Arti</th><th class="p-2 text-left border-b border-surface-raised">Tindakan</th></tr></thead><tbody>${block.items.map(i => `<tr class="border-b border-surface-raised/50"><td class="p-2 font-mono text-xs text-accent-cyan">${i.label}</td><td class="p-2 text-text-primary">${i.meaning}</td><td class="p-2 text-text-muted">${i.action}</td></tr>`).join('')}</tbody></table></div>`;
    }
    return '';
  }
</script>

<article class="h-full flex flex-col md:flex-row">
  <aside class="md:hidden border-b border-surface-raised px-4 py-3">
    <details class="group">
      <summary class="text-sm font-semibold text-text-primary cursor-pointer select-none">Daftar Isi</summary>
      <nav aria-label="Daftar isi manual" class="mt-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
        {#each results as section (section.id)}
          <a href="#manual-{section.id}" class="text-sm text-text-muted hover:text-accent-cyan transition-colors py-0.5">
            {section.title}
          </a>
        {/each}
      </nav>
    </details>
  </aside>

  <aside class="hidden md:block md:w-56 md:min-w-[200px] border-r border-surface-raised bg-surface-dark md:sticky md:top-0 md:h-screen overflow-y-auto">
    <nav aria-label="Daftar isi manual" class="p-4 flex flex-col gap-1">
      <div class="text-xs text-text-dimmed uppercase tracking-wider mb-2 font-semibold">Daftar Isi</div>
      {#each results as section (section.id)}
        <a href="#manual-{section.id}"
          class="text-sm text-text-muted hover:text-accent-cyan transition-colors py-0.5 block">
          {section.title}
        </a>
      {/each}
    </nav>
  </aside>

  <div class="flex-1 min-w-0 overflow-y-auto">
    <div class="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 class="text-xl font-bold text-text-primary">Manual Pengguna AirVIA</h2>
        <div class="relative">
          <input
            type="search"
            aria-label="Cari di manual"
            placeholder="Cari topik..."
            bind:value={query}
            class="w-full sm:w-64 px-3 py-2 bg-surface-raised border border-surface-raised rounded-lg text-sm text-text-primary placeholder-text-dimmed focus:outline-none focus:border-accent-cyan transition-colors"
          />
          {#if query}
            <button onclick={resetSearch}
              class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-accent-cyan hover:underline">
              Reset
            </button>
          {/if}
        </div>
      </div>

      {#if results.length === 0}
        <div class="text-center py-12 text-text-muted text-sm">
          Tidak ditemukan hasil untuk pencarian ini.
          <button onclick={resetSearch}
            class="ml-1 text-accent-cyan hover:underline">
            Reset pencarian
          </button>
        </div>
      {:else}
        {#each results as section (section.id)}
          <section id="manual-{section.id}" class="scroll-mt-4 border-b border-surface-raised/50 pb-6 last:border-b-0">
            <h3 class="text-lg font-bold text-text-primary mb-2">{section.title}</h3>
            <p class="text-sm text-text-muted mb-3">{section.summary}</p>

            {#each section.blocks as block}
              {@html renderBlock(block)}
            {/each}

            <a href="#manual-{section.id}"
              class="inline-block mt-3 text-xs text-accent-violet hover:underline">
              Back to top ↑
            </a>
          </section>
        {/each}
      {/if}
    </div>
  </div>
</article>
