<script lang="ts">
  import { getDefinition, getActiveLayer } from '../../store/app.svelte';
  import KeymapCell from './KeymapCell.svelte';

  const def = $derived(getDefinition());
  const layer = $derived(getActiveLayer());

  const cols = $derived(def?.matrix.cols ?? 0);
  const rows = $derived(def?.matrix.rows ?? 0);

  const gridCols = $derived(
    def ? def.layouts.keymap.reduce((max, k) => Math.max(max, k.x + (k.w ?? 1)), 0) : 0,
  );
  const gridRows = $derived(
    def ? def.layouts.keymap.reduce((max, k) => Math.max(max, k.y + (k.h ?? 1)), 0) : 0,
  );

  const positions = $derived(
    def
      ? def.layouts.keymap.map((k, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          return { key: k, row: r, col: c, index: i };
        })
      : [],
  );
</script>

<div class="w-full h-full overflow-auto p-4">
  {#if !def}
    <div class="text-gray-500 text-center mt-16">
      No definition loaded. Connect a device to view keymap.
    </div>
  {:else}
    <div
      class="grid gap-1 mx-auto"
      style="grid-template-columns: repeat({gridCols}, minmax(3rem, 1fr)); grid-template-rows: repeat({gridRows}, minmax(3rem, 1fr))"
    >
      {#each positions as pos (pos.index)}
        <div
          style="grid-column: {pos.key.x + 1} / span {pos.key.w ?? 1}; grid-row: {pos.key.y + 1} / span {pos.key.h ?? 1}"
        >
          <KeymapCell layer={layer} row={pos.row} col={pos.col} />
        </div>
      {/each}
    </div>
  {/if}
</div>
