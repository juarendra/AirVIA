<script lang="ts">
  import { keycodeAt, getKeycodeLabel, getSelectedCell, setSelectedCell } from '../../store/app.svelte';

  let { layer, row, col }: { layer: number; row: number; col: number } = $props();

  const code = $derived(keycodeAt(layer, row, col));
  const fullLabel = $derived(getKeycodeLabel(code));
  const displayLabel = $derived(fullLabel.replace(/^KC_/, ''));
  const selected = $derived(getSelectedCell());

  const isSelected = $derived(
    selected !== null && selected.layer === layer && selected.row === row && selected.col === col,
  );

  const colorClass = $derived(
    code === 0 ? 'text-slate-300'
      : code === 1 ? 'text-slate-400 italic'
      : 'text-slate-700',
  );

  function handleClick() {
    setSelectedCell({ layer, row, col });
  }
</script>

<button
  onclick={handleClick}
  title="{fullLabel} (0x{code.toString(16).toUpperCase().padStart(4, '0')})"
  class="flex items-center justify-center text-[11px] font-mono w-full h-full rounded-lg
         bg-white border border-slate-200 shadow-sm
         hover:border-blue-400 hover:shadow-md hover:bg-blue-50
         {colorClass}
         {isSelected ? 'border-blue-500 bg-blue-50' : ''}"
>
  {displayLabel}
</button>
