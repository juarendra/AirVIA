<script lang="ts">
  import { getEncoderCount, getEncoderMap, getEncoderKeycode, setEncoderKeycode, getActiveLayer } from '../../store/app.svelte';
  import { KEYCODES_BY_CATEGORY, CATEGORY_LABELS, keycodeLabel, type KeycodeEntry, type KeycodeCategory } from '../../core/keycodes';
  import { Protocol } from '../../core/protocol';
  import { sendPacket } from '../../ble/dispatch';
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
    sendPacket(Protocol.setEncoderKeycode(activeLayer, editing.enc, editing.cw ? 1 : 0, code >> 8, code & 0xFF));
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
  <h3 class="text-base font-semibold text-slate-700 mb-3">Encoder Assignment — Layer {activeLayer}</h3>

  {#if encoderCount === 0}
    <p class="text-slate-400 text-sm italic">No encoders defined in V3 definition</p>
  {:else}
    <div class="space-y-3">
      {#each Array(encoderCount) as _, enc (enc)}
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div class="text-sm font-medium text-slate-600 mb-2">Encoder {enc}</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => openPicker(enc, true)}
              class="flex flex-col items-start gap-1 p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <span class="text-xs text-slate-400">CW</span>
              <span class="text-sm text-slate-700 font-mono">{cwLabel(enc)}</span>
            </button>
            <button
              onclick={() => openPicker(enc, false)}
              class="flex flex-col items-start gap-1 p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left"
            >
              <span class="text-xs text-slate-400">CCW</span>
              <span class="text-sm text-slate-700 font-mono">{ccwLabel(enc)}</span>
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
      class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />

    <div class="flex gap-1 flex-wrap">
      {#each categories as cat}
        <button
          onclick={() => pickerCategory = cat}
          class="rounded-full px-3 py-1 text-xs transition-colors
                 {pickerCategory === cat
                   ? 'bg-blue-600 text-white shadow-sm'
                   : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}"
        >
          {CATEGORY_LABELS[cat]}
        </button>
      {/each}
    </div>

    <div class="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
      {#each visibleEntries as entry (entry.code)}
        <button
          onclick={() => selectKeycode(entry.code)}
          class="px-2 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-slate-700 rounded-lg border border-slate-100 transition-colors text-center truncate font-mono"
          title={entry.label}
        >
          {entry.label}
        </button>
      {/each}
    </div>
  </div>
</Modal>
