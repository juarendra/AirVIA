<script lang="ts">
  import { getEncoderCount, getEncoderMap, getEncoderKeycode, setEncoderKeycode, getActiveLayer } from '../../store/app.svelte';
  import { KEYCODES_BY_CATEGORY, CATEGORY_LABELS, keycodeLabel, type KeycodeEntry, type KeycodeCategory } from '../../core/keycodes';
  import Modal from '../shared/Modal.svelte';

  let editing = $state<{ enc: number; cw: boolean } | null>(null);
  let search = $state('');
  let pickerCategory = $state<KeycodeCategory>('basic');

  const encoderCount = $derived(getEncoderCount());
  const activeLayer = $derived(getActiveLayer());

  const categories: KeycodeCategory[] = ['basic', 'modifier', 'layer', 'boot', 'media', 'system'];

  function filterBySearch(entries: KeycodeEntry[]): KeycodeEntry[] {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => e.label.toLowerCase().includes(q));
  }

  const visibleEntries = $derived(filterBySearch(KEYCODES_BY_CATEGORY[pickerCategory]));

  function openPicker(enc: number, cw: boolean) {
    editing = { enc, cw };
    search = '';
    pickerCategory = 'basic';
  }

  function closePicker() {
    editing = null;
  }

  function selectKeycode(code: number) {
    if (!editing) return;
    setEncoderKeycode(activeLayer, editing.enc, editing.cw, code);
    editing = null;
  }

  function cwLabel(enc: number): string {
    return keycodeLabel(getEncoderKeycode(activeLayer, enc, true));
  }

  function ccwLabel(enc: number): string {
    return keycodeLabel(getEncoderKeycode(activeLayer, enc, false));
  }
</script>

<div class="p-4">
  <h3 class="text-base font-semibold text-gray-200 mb-3">Encoder Assignment — Layer {activeLayer}</h3>

  {#if encoderCount === 0}
    <p class="text-gray-500 text-sm italic">No encoders defined in V3 definition</p>
  {:else}
    <div class="space-y-3">
      {#each Array(encoderCount) as _, enc (enc)}
        <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div class="text-sm font-medium text-gray-300 mb-2">Encoder {enc}</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => openPicker(enc, true)}
              class="flex flex-col items-start gap-1 p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded border border-gray-600 transition-colors text-left"
            >
              <span class="text-xs text-gray-500">CW</span>
              <span class="text-sm text-gray-200 font-mono">{cwLabel(enc)}</span>
            </button>
            <button
              onclick={() => openPicker(enc, false)}
              class="flex flex-col items-start gap-1 p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded border border-gray-600 transition-colors text-left"
            >
              <span class="text-xs text-gray-500">CCW</span>
              <span class="text-sm text-gray-200 font-mono">{ccwLabel(enc)}</span>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal
  show={editing !== null}
  title={editing ? `Encoder ${editing.enc} — ${editing.cw ? 'CW' : 'CCW'}` : ''}
  onclose={closePicker}
>
  <div class="flex flex-col gap-3">
    <input
      type="text"
      placeholder="Search keycodes..."
      bind:value={search}
      class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />

    <div class="flex gap-1 flex-wrap">
      {#each categories as cat}
        <button
          onclick={() => pickerCategory = cat}
          class="px-2.5 py-1 text-xs rounded transition-colors
                 {pickerCategory === cat
                   ? 'bg-blue-600 text-white'
                   : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'}"
        >
          {CATEGORY_LABELS[cat]}
        </button>
      {/each}
    </div>

    <div class="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
      {#each visibleEntries as entry (entry.code)}
        <button
          onclick={() => selectKeycode(entry.code)}
          class="px-2 py-1.5 text-xs text-gray-300 bg-gray-700/60 hover:bg-blue-600/40 hover:text-gray-100 rounded border border-gray-600/50 transition-colors text-center truncate font-mono"
          title={entry.label}
        >
          {entry.label}
        </button>
      {/each}
    </div>
  </div>
</Modal>
