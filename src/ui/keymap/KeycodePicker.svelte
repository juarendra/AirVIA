<script lang="ts">
  import Modal from '../shared/Modal.svelte';
  import { getSelectedCell, setSelectedCell, setKeycodeAt } from '../../store/app.svelte';
  import { KEYCODES_BY_CATEGORY, CATEGORY_LABELS, type KeycodeEntry, type KeycodeCategory } from '../../core/keycodes';

  let search = $state('');
  let activeCategory = $state<KeycodeCategory>('basic');

  const selectedCell = $derived(getSelectedCell());

  const allEntries = $derived(Object.values(KEYCODES_BY_CATEGORY).flat());

  const filteredEntries = $derived.by(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return allEntries.filter(e =>
      e.label.toLowerCase().includes(q) ||
      e.code.toString(16).includes(q)
    );
  });

  const categoryEntries = $derived(KEYCODES_BY_CATEGORY[activeCategory]);

  const isSearching = $derived(search.trim().length > 0);

  const categories = Object.keys(CATEGORY_LABELS) as KeycodeCategory[];

  function select(entry: KeycodeEntry) {
    const cell = selectedCell;
    if (!cell) return;
    setKeycodeAt(cell.layer, cell.row, cell.col, entry.code);
    setSelectedCell(null);
    search = '';
  }

  function close() {
    setSelectedCell(null);
    search = '';
  }

  function labelWithoutPrefix(label: string): string {
    const p = label.replace(/^KC_/, '');
    return p.length < label.length ? p : label;
  }

  function hexStr(code: number): string {
    return `0x${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }
</script>

<Modal show={selectedCell !== null} title="Keycode Picker" onclose={close}>
  <div class="flex flex-col gap-3">
    <input
      type="text"
      bind:value={search}
      placeholder="Search by label or hex code..."
      class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm
             placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
    />

    {#if !isSearching}
      <div class="flex flex-wrap gap-1">
        {#each categories as cat}
          <button
            onclick={() => (activeCategory = cat)}
            class="px-2.5 py-1 rounded text-xs font-medium transition-colors
                   {activeCategory === cat
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'}"
          >
            {CATEGORY_LABELS[cat]}
          </button>
        {/each}
      </div>

      <div class="grid grid-cols-4 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {#each categoryEntries as entry (entry.code)}
          <button
            onclick={() => select(entry)}
            class="flex flex-col items-center justify-center p-2 bg-gray-800 border border-gray-700 rounded
                   hover:border-blue-500 hover:bg-gray-750 transition-colors text-center gap-0.5"
          >
            <span class="text-gray-100 text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
            <span class="text-gray-500 text-[10px] font-mono">{hexStr(entry.code)}</span>
          </button>
        {/each}
      </div>
    {:else}
      {#if filteredEntries.length > 0}
        <div class="grid grid-cols-4 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {#each filteredEntries as entry (entry.code)}
            <button
              onclick={() => select(entry)}
              class="flex flex-col items-center justify-center p-2 bg-gray-800 border border-gray-700 rounded
                     hover:border-blue-500 hover:bg-gray-750 transition-colors text-center gap-0.5"
            >
              <span class="text-gray-100 text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
              <span class="text-gray-500 text-[10px] font-mono">{hexStr(entry.code)}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500 text-sm">No keycodes found</div>
      {/if}
    {/if}
  </div>
</Modal>
