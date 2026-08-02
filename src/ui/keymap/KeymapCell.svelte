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
    code === 0 ? 'text-gray-700'
      : code === 1 ? 'text-gray-500 italic'
      : 'text-gray-200',
  );

  function handleClick() {
    setSelectedCell({ layer, row, col });
  }
</script>

<button
  onclick={handleClick}
  title="{fullLabel} (0x{code.toString(16).toUpperCase().padStart(4, '0')})"
  class="flex items-center justify-center text-xs font-mono w-full h-full rounded
         bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 hover:border-blue-500
         {colorClass}
         {isSelected ? 'border-blue-500 bg-gray-700/90' : ''}"
>
  {displayLabel}
</button>
