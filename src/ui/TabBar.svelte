<script lang="ts">
  import { getActiveTab, setActiveTab } from '../store/app.svelte';
  import Icon from './shared/Icon.svelte';

  const tabs: Array<{ id: string; label: string; icon: string }> = [
    { id: 'keymap', label: 'KEYMAP', icon: 'keyboard' },
    { id: 'encoder', label: 'ENCODER', icon: 'settings' },
    { id: 'macros', label: 'MACROS', icon: 'terminal' },
    { id: 'lighting', label: 'LIGHTING', icon: 'sun' },
    { id: 'layout', label: 'LAYOUT', icon: 'drag' },
    { id: 'console', label: 'CONSOLE', icon: 'terminal' },
  ];

  const active = $derived(getActiveTab());
</script>

<nav class="bg-gray-900 border-b border-gray-700 flex">
  {#each tabs as tab}
    <button
      onclick={() => setActiveTab(tab.id)}
      class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors
             {active === tab.id
               ? 'text-blue-400 border-blue-500'
               : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'}"
    >
      <Icon name={tab.icon} class="w-4 h-4" />
      {tab.label}
    </button>
  {/each}
</nav>
