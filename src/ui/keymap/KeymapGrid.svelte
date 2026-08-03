<script lang="ts">
  import { getDefinition, getActiveLayer, getSyncPhase, getSyncProgress, getPendingChanges, getSelectedTarget, setSelectedTarget } from '../../store/app.svelte';
  import KeymapCell from './KeymapCell.svelte';

  const def = $derived(getDefinition());
  const activeLayer = $derived(getActiveLayer());
  const selected = $derived(getSelectedTarget());
  const CELL = 52;

  const positions = $derived(() => {
    if (!def) return [];
    return def.layouts.keymap.map(k => ({
      ...k,
      row: k.row,
      col: k.col,
    }));
  });

  const containerStyle = $derived(() => {
    if (!def || !positions.length) return {};
    const maxX = Math.max(...positions.map(p => p.x + (p.w ?? 1)));
    const maxY = Math.max(...positions.map(p => p.y + (p.h ?? 1)));
    return {
      width: `${maxX * CELL}px`,
      height: `${maxY * CELL}px`,
      position: 'relative',
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    if (!def || !selected || selected.type !== 'key') return;
    
    // Find index of currently selected key
    const currentIndex = def.layouts.keymap.findIndex(k => k.row === selected.row && k.col === selected.col);
    if (currentIndex === -1) return;

    const currentKey = def.layouts.keymap[currentIndex];
    
    let nextKey;

    // Ponytail: Simple spatial navigation by bounding box intersection/closest center
    // Fall back to DOM array order if simple geometry is too fuzzy, but let's just use array index offsets for simplicity if matrix is roughly linear
    // Actually, matrix row/col might not perfectly align with visual layout. 
    // Best effort mapping: 
    switch (e.key) {
      case 'ArrowRight':
        nextKey = def.layouts.keymap[currentIndex + 1];
        break;
      case 'ArrowLeft':
        nextKey = def.layouts.keymap[currentIndex - 1];
        break;
      case 'ArrowUp':
        // find nearest key above
        nextKey = def.layouts.keymap.slice().sort((a,b) => {
          const dyA = a.y - (currentKey.y - 1);
          const dxA = a.x - currentKey.x;
          const dyB = b.y - (currentKey.y - 1);
          const dxB = b.x - currentKey.x;
          return (dxA*dxA + dyA*dyA) - (dxB*dxB + dyB*dyB);
        }).find(k => k.y < currentKey.y);
        break;
      case 'ArrowDown':
        nextKey = def.layouts.keymap.slice().sort((a,b) => {
          const dyA = a.y - (currentKey.y + 1);
          const dxA = a.x - currentKey.x;
          const dyB = b.y - (currentKey.y + 1);
          const dxB = b.x - currentKey.x;
          return (dxA*dxA + dyA*dyA) - (dxB*dxB + dyB*dyB);
        }).find(k => k.y > currentKey.y);
        break;
      default:
        return;
    }

    if (nextKey) {
      e.preventDefault();
      setSelectedTarget({ type: 'key', layer: selected.layer, row: nextKey.row, col: nextKey.col });
      setTimeout(() => {
        const el = document.getElementById(`cell-${selected.layer}-${nextKey.row}-${nextKey.col}`);
        if (el) el.focus();
      }, 0);
    }
  }
</script>

{#if def}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="p-4 overflow-x-auto min-w-max relative" style="max-height: calc(100dvh - 200px)" onkeydown={handleKeydown} tabindex="0">
    {#if getSyncPhase() !== 'ready'}
      <div class="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
        <span class="text-slate-500 font-medium text-sm">
          {getSyncPhase() === 'syncing' ? getSyncProgress() : 'Connect and sync to edit'}
        </span>
      </div>
    {/if}
    <div class="mx-auto" style={containerStyle}>
      {#each positions as pos (pos.row * def.matrix.cols + pos.col)}
        {@const style = `position:absolute;left:${pos.x * CELL}px;top:${pos.y * CELL}px;width:${(pos.w ?? 1) * CELL - 4}px;height:${(pos.h ?? 1) * CELL - 4}px;`}
        {#if (pos.r ?? 0) !== 0}
          {@const rx = (pos.rx ?? 0) * CELL}
          {@const ry = (pos.ry ?? 0) * CELL}
          <div style={`${style}transform:rotate(${pos.r}deg);transform-origin:${rx}px ${ry}px`}>
            <KeymapCell layer={activeLayer} row={pos.row} col={pos.col} />
          </div>
        {:else}
          <div style={style} class="p-0.5">
            <KeymapCell layer={activeLayer} row={pos.row} col={pos.col} />
          </div>
        {/if}
      {/each}
    </div>
    <div class="text-xs text-slate-400 text-center mt-2">
      {def.name} &mdash; {def.matrix.rows}&times;{def.matrix.cols} matrix
    </div>
    {#if getPendingChanges() > 0}
      <div class="text-xs text-orange-500 text-center mt-1">
        {getPendingChanges()} pending changes &mdash; Save to persist
      </div>
    {/if}
  </div>
{:else}
  <div class="flex items-center justify-center h-64">
    <div class="text-center text-slate-400">
      <p class="text-lg mb-2">No definition loaded</p>
      <p class="text-sm">Use the button at bottom-left to load a V3 definition JSON file.</p>
      <p class="text-xs mt-1">VIA v3 schema with explicit matrix coordinates per key.</p>
    </div>
  </div>
{/if}
