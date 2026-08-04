<script lang="ts">
  import { getActiveTab, setActiveTab } from '../store/app.svelte';
  import type { AppDestination } from './navigation';
  import Icon from './shared/Icon.svelte';

  const tabs: Array<{ id: AppDestination; label: string; icon: string }> = [
    { id: 'keymap', label: 'KEYMAP', icon: 'keyboard' },
    { id: 'encoder', label: 'ENCODER', icon: 'settings' },
    { id: 'macros', label: 'MACROS', icon: 'terminal' },
    { id: 'lighting', label: 'LIGHTING', icon: 'sun' },
    { id: 'layout', label: 'LAYOUT', icon: 'drag' },
    { id: 'actions', label: 'ACTIONS', icon: 'trash' },
    { id: 'console', label: 'CONSOLE', icon: 'terminal' },
  ];

  const active = $derived(getActiveTab());
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<nav role="tablist" class="mx-4 my-2 flex md:flex-col overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
  {#each tabs as tab}
    <button
      role="tab"
      aria-selected={active === tab.id}
      onclick={() => setActiveTab(tab.id)}
      class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors
             {active === tab.id
               ? 'bg-surface-raised text-accent-cyan'
               : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'}"
    >
      <Icon name={tab.icon} class="w-4 h-4" />
      {tab.label}
    </button>
  {/each}
</nav>
