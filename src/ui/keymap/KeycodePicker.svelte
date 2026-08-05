<script lang="ts">
  import Modal from '../shared/Modal.svelte';
  import { getSelectedTarget, setSelectedTarget, setKeycodeAt, setEncoderKeycode, markDirty } from '../../store/app.svelte';
  import { KEYCODES_BY_CATEGORY, CATEGORY_LABELS, type KeycodeEntry, type KeycodeCategory } from '../../core/keycodes';
  import { Protocol } from '../../core/protocol';
  import { sendViaCommand } from '../../ble/dispatch';

  let search = $state('');
  let activeCategory = $state<KeycodeCategory>('basic');

  const selectedTarget = $derived(getSelectedTarget());

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

  async function select(entry: KeycodeEntry) {
    const target = selectedTarget;
    if (!target) return;
    
    // Close modal first for responsiveness
    setSelectedTarget(null);
    search = '';
    
    try {
      if (target.type === 'key') {
        await sendViaCommand(Protocol.setKeycode(target.layer, target.row, target.col, entry.code >> 8, entry.code & 0xFF));
        setKeycodeAt(target.layer, target.row, target.col, entry.code);
      } else if (target.type === 'encoder') {
        await sendViaCommand(Protocol.setEncoderKeycode(target.layer, target.id, target.cw ? 1 : 0, entry.code >> 8, entry.code & 0xFF));
        setEncoderKeycode(target.layer, target.id, target.cw, entry.code);
      }
      markDirty();
    } catch (err) {
      console.error('Failed to update keycode', err);
    }
  }

  function close() {
    setSelectedTarget(null);
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

<Modal show={selectedTarget !== null} title="Keycode Picker" onclose={close}>
  <div class="flex flex-col gap-3">
    <input
      type="text"
      bind:value={search}
      placeholder="Search by label or hex code..."
      class="w-full px-4 py-2 bg-[var(--air-surface)] border border-[#1f3554] rounded-[var(--air-radius-md)] text-[var(--air-text-primary)] text-sm
             placeholder:text-[var(--air-text-dimmed)] focus:outline-none focus:border-[var(--air-cyan)] focus:ring-2 focus:ring-[var(--air-cyan)]/20 transition-colors"
    />

    {#if !isSearching}
      <div class="flex flex-wrap gap-1">
        {#each categories as cat}
          <button
            onclick={() => (activeCategory = cat)}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors
                   {activeCategory === cat
                     ? 'bg-[var(--air-cyan)] text-[#060912] shadow-sm'
                     : 'bg-[var(--air-surface)] text-[var(--air-text-muted)] hover:text-[var(--air-text-primary)] hover:bg-[var(--air-raised)]'}"
          >
            {CATEGORY_LABELS[cat]}
          </button>
        {/each}
      </div>

      <div class="grid gap-1.5 max-h-[50vh] overflow-y-auto pr-1" style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))">
        {#each categoryEntries as entry (entry.code)}
          <button
            onclick={() => select(entry)}
            class="flex flex-col items-center justify-center p-2 bg-[var(--air-surface)] border border-[#1f3554] rounded-[var(--air-radius-md)]
                   hover:border-[var(--air-cyan)] hover:bg-[var(--air-raised)] transition-colors text-center gap-0.5"
            >
             <span class="text-[var(--air-text-primary)] text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
             <span class="text-[var(--air-text-dimmed)] text-[10px] font-mono">{hexStr(entry.code)}</span>
          </button>
        {/each}
      </div>
    {:else}
      {#if filteredEntries.length > 0}
        <div class="grid gap-1.5 max-h-[50vh] overflow-y-auto pr-1" style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))">
          {#each filteredEntries as entry (entry.code)}
            <button
              onclick={() => select(entry)}
             class="flex flex-col items-center justify-center p-2 bg-[var(--air-surface)] border border-[#1f3554] rounded-[var(--air-radius-md)]
                   hover:border-[var(--air-cyan)] hover:bg-[var(--air-raised)] transition-colors text-center gap-0.5"
            >
              <span class="text-[var(--air-text-primary)] text-xs font-medium">{labelWithoutPrefix(entry.label)}</span>
              <span class="text-[var(--air-text-dimmed)] text-[10px] font-mono">{hexStr(entry.code)}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-[var(--air-text-dimmed)] text-sm">No keycodes found</div>
      {/if}
    {/if}
  </div>
</Modal>
