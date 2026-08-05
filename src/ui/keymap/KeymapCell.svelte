<script lang="ts">
  import { keycodeAt, getKeycodeLabel, getSelectedTarget, setSelectedTarget } from '../../store/app.svelte';

  let { layer, row, col }: { layer: number; row: number; col: number } = $props();

  const code = $derived(keycodeAt(layer, row, col));
  const fullLabel = $derived(getKeycodeLabel(code));
  const displayLabel = $derived(fullLabel.replace(/^KC_/, ''));
  const selected = $derived(getSelectedTarget());

  const isSelected = $derived(
    selected !== null && selected.type === 'key' && selected.layer === layer && selected.row === row && selected.col === col,
  );

  const colorClass = $derived(
    code === 0 ? 'text-[var(--air-text-dimmed)]'
      : code === 1 ? 'text-[var(--air-text-dimmed)] italic opacity-60'
      : 'text-[var(--air-text-primary)]',
  );

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedTarget({ type: 'key', layer, row, col });
    }
  }

  function handleClick() {
    setSelectedTarget({ type: 'key', layer, row, col });
  }
</script>

<button
  id={`cell-${layer}-${row}-${col}`}
  onclick={handleClick}
  onkeydown={handleKeydown}
  tabindex={isSelected ? 0 : -1}
  aria-pressed={isSelected}
  title="{fullLabel} (0x{code.toString(16).toUpperCase().padStart(4, '0')})"
  class="flex items-center justify-center text-[11px] font-mono font-[var(--air-font-mono)] w-full h-full rounded-[var(--air-radius-md)]
         bg-[#162342] border border-[#1f3554]
         shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.5)]
         hover:border-[var(--air-cyan)] hover:shadow-[inset_0_1px_0_rgba(56,216,227,0.15),inset_0_-1px_0_rgba(0,0,0,0.3),0_0_8px_rgba(56,216,227,0.2)]
         {colorClass}
         {isSelected ? 'border-[var(--air-cyan)] shadow-[inset_0_1px_0_rgba(56,216,227,0.2),inset_0_-1px_0_rgba(0,0,0,0.3),0_0_12px_rgba(56,216,227,0.3)] text-[var(--air-cyan)]' : ''}"
>
  {displayLabel}
</button>
