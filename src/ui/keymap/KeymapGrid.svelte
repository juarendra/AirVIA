<script lang="ts">
  import { getDefinition, getActiveLayer } from '../../store/app.svelte';
  import KeymapCell from './KeymapCell.svelte';

  const def = $derived(getDefinition());
  const layer = $derived(getActiveLayer());
  const cellSize = 52;

  const cols = $derived(def?.matrix.cols ?? 0);

  const positions = $derived(
    def
      ? def.layouts.keymap.map((k, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          return { key: k, row: r, col: c, index: i };
        })
      : [],
  );

  const maxX = $derived(
    def ? def.layouts.keymap.reduce((max, k) => Math.max(max, k.x + (k.w ?? 1)), 0) : 0,
  );
  const maxY = $derived(
    def ? def.layouts.keymap.reduce((max, k) => Math.max(max, k.y + (k.h ?? 1)), 0) : 0,
  );

  const containerW = $derived((maxX + 1) * cellSize);
  const containerH = $derived((maxY + 1) * cellSize);
</script>

<div class="w-full h-full overflow-auto p-4">
  {#if !def}
    <div class="text-slate-400 text-center mt-16">
      No definition loaded. Connect a device to view keymap.
    </div>
  {:else}
    <div
      class="relative mx-auto"
      style="width: {containerW}px; height: {containerH}px"
    >
      {#each positions as pos (pos.index)}
        <div
          style="position: absolute; left: {pos.key.x * cellSize}px; top: {pos.key.y * cellSize}px; width: {(pos.key.w ?? 1) * cellSize - 4}px; height: {(pos.key.h ?? 1) * cellSize - 4}px"
        >
          <KeymapCell layer={layer} row={pos.row} col={pos.col} />
        </div>
      {/each}
    </div>
  {/if}
</div>
