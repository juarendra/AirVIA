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

<nav class="bg-slate-100 mx-4 my-2 rounded-full p-1 flex">
  {#each tabs as tab}
    <button
      onclick={() => setActiveTab(tab.id)}
      class="flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-all
             {active === tab.id
               ? 'bg-white text-slate-800 shadow-sm'
               : 'text-slate-500 hover:text-slate-700'}"
    >
      <Icon name={tab.icon} class="w-4 h-4" />
      {tab.label}
    </button>
  {/each}
</nav>
