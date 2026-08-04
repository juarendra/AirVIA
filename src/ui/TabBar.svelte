<script lang="ts">
  import { getActiveTab, setActiveTab } from '../store/app.svelte';
  import { navigationGroups, primaryMobileDestinations, advancedMobileDestinations, destinationById } from './navigation';
  import type { DestinationItem } from './navigation';
  import Icon from './shared/Icon.svelte';

  const active = $derived(getActiveTab());

  let sheetOpen = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      sheetOpen = false;
    }
  }

  function select(item: DestinationItem) {
    setActiveTab(item.id);
    sheetOpen = false;
  }
</script>

<!-- Desktop rail -->
<nav aria-label="Main navigation" class="hidden md:flex flex-col gap-3 px-3 py-4 overflow-y-auto">
  {#each navigationGroups as group}
    <div class="flex flex-col gap-0.5">
      <span class="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-text-dimmed select-none">{group.label}</span>
      {#each group.items as itemId}
        {@const dest = destinationById(itemId)}
        {#if dest}
          <button
            aria-current={active === dest.id ? 'page' : undefined}
            onclick={() => setActiveTab(dest.id)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left
                   {active === dest.id
                     ? 'bg-accent-cyan/10 text-accent-cyan shadow-[inset_0_0_0_1px_var(--color-accent-violet)]'
                     : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'}"
          >
            <Icon name={dest.icon} class="w-4 h-4 shrink-0" />
            <span class="truncate">{dest.label}</span>
          </button>
        {/if}
      {/each}
    </div>
  {/each}
</nav>

<!-- Mobile primary bar -->
<nav aria-label="Primary navigation" class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-dark border-t border-surface-raised pb-[env(safe-area-inset-bottom,0px)]">
  <div class="flex items-center justify-around h-14 px-1">
    {#each primaryMobileDestinations as item}
      <button
        aria-current={active === item.id ? 'page' : undefined}
        onclick={() => setActiveTab(item.id)}
        class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors
               {active === item.id ? 'text-accent-cyan' : 'text-text-muted'}"
        title={item.title}
      >
        <Icon name={item.icon} class="w-5 h-5" />
        <span class="text-[0.6rem] leading-none truncate max-w-full">{item.label}</span>
      </button>
    {/each}
    <button
      onclick={() => sheetOpen = true}
      class="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 text-text-muted transition-colors"
      title="More"
    >
      <Icon name="menu" class="w-5 h-5" />
      <span class="text-[0.6rem] leading-none">More</span>
    </button>
  </div>
</nav>

<!-- Advanced sheet -->
{#if sheetOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/60 md:hidden"
    role="presentation"
    onclick={() => sheetOpen = false}
    onkeydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div
      role="dialog"
      aria-label="Advanced navigation"
      tabindex="-1"
      class="absolute bottom-0 inset-x-0 bg-surface-dark rounded-t-xl border-t border-surface-raised pb-[env(safe-area-inset-bottom,0px)] max-h-[70vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-surface-raised">
        <h2 class="text-sm font-semibold text-text-primary">Advanced</h2>
        <button
          aria-label="Close"
          onclick={() => sheetOpen = false}
          class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <Icon name="close" class="w-5 h-5" />
        </button>
      </div>
      <div class="flex flex-col gap-1 p-3">
        {#each advancedMobileDestinations as item}
          <button
            onclick={() => select(item)}
            class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-text-primary hover:bg-surface-elevated transition-colors text-left"
          >
            <Icon name={item.icon} class="w-5 h-5 text-text-muted shrink-0" />
            <div class="flex flex-col min-w-0">
              <span class="font-medium truncate">{item.title}</span>
              <span class="text-xs text-text-muted truncate">{item.description}</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
