<script lang="ts">
  import Modal from '../shared/Modal.svelte';
  import { getSelectedCell, setSelectedCell, setKeycodeAt } from '../../store/app.svelte';
  import { KEYCODES_BY_CATEGORY, CATEGORY_LABELS, type KeycodeEntry, type KeycodeCategory } from '../../core/keycodes';
  import { Protocol } from '../../core/protocol';
  import { sendPacket } from '../../ble/dispatch';

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
    sendPacket(Protocol.setKeycode(cell.layer, cell.row, cell.col, entry.code >> 8, entry.code & 0xFF));
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
      class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-sm
             placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
    />

    {#if !isSearching}
      <div class="flex flex-wrap gap-1">
        {#each categories as cat}
          <button
            onclick={() => (activeCategory = cat)}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors
                   {activeCategory === cat
                     ? 'bg-blue-600 text-white shadow-sm'
                     : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'}"
          >
            {CATEGORY_LABELS[cat]}
          </button>
        {/each}
      </div>

      <div class="grid grid-cols-4 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {#each categoryEntries as entry (entry.code)}
          <button
            onclick={() => select(entry)}
            class="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-lg
                   hover:border-blue-200 hover:bg-blue-50 transition-colors text-center gap-0.5"
          >
             <span class="text-slate-700 text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
            <span class="text-slate-400 text-[10px] font-mono">{hexStr(entry.code)}</span>
          </button>
        {/each}
      </div>
    {:else}
      {#if filteredEntries.length > 0}
        <div class="grid grid-cols-4 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {#each filteredEntries as entry (entry.code)}
            <button
              onclick={() => select(entry)}
             class="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-lg
                   hover:border-blue-200 hover:bg-blue-50 transition-colors text-center gap-0.5"
            >
              <span class="text-slate-700 text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
              <span class="text-slate-400 text-[10px] font-mono">{hexStr(entry.code)}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-slate-400 text-sm">No keycodes found</div>
      {/if}
    {/if}
  </div>
</Modal>
