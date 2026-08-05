<script lang="ts">
  import {
    getActiveTab,
    getConnectionState,
    getProtocolVersion,
    getLayerCount,
    getPendingChanges,
    getDeviceName
  } from '../../store/app.svelte';
  import { destinationById } from '../navigation';
  import LayerSelector from '../keymap/LayerSelector.svelte';
  import Icon from '../shared/Icon.svelte';

  const activeTab = $derived(getActiveTab());
  const dest = $derived(destinationById(activeTab));
  const connState = $derived(getConnectionState());
  const protocolVersion = $derived(getProtocolVersion());
  const layerCount = $derived(getLayerCount());
  const pendingChanges = $derived(getPendingChanges());
  const deviceName = $derived(getDeviceName());

  const isManual = $derived(activeTab === 'manual');
  const showLayers = $derived(activeTab === 'keymap' || activeTab === 'encoder');

  const stateDot: Record<string, string> = {
    connected: 'bg-accent-lime',
    connecting: 'bg-accent-amber animate-pulse',
    error: 'bg-accent-red',
    disconnected: 'bg-text-dimmed',
  };

  const connectionIcons: Record<string, string> = {
    connected: 'bluetooth',
    connecting: 'bluetooth',
    error: 'bluetooth',
    disconnected: 'disconnect',
  };

  function stateLabel(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
</script>

<header class="bg-surface-dark border-b border-surface-raised">
  <div class="px-4 py-3 md:px-5 md:py-4 flex flex-col gap-3">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-3 min-w-0">
        <Icon name={dest?.icon ?? 'keyboard'} class="w-5 h-5 text-accent-cyan shrink-0" />
        <div class="flex flex-col min-w-0">
          <h1 class="text-base md:text-lg font-bold text-text-primary truncate">
            {dest?.title ?? 'Workspace'}
          </h1>
          {#if deviceName && connState === 'connected'}
            <span class="text-[0.65rem] text-text-muted truncate">{deviceName}</span>
          {/if}
        </div>
      </div>

      {#if !isManual}
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-elevated border border-surface-raised">
            <span class="w-1.5 h-1.5 rounded-full {stateDot[connState] ?? 'bg-text-dimmed'}" aria-label={connState}></span>
            <span class="text-text-muted">{stateLabel(connState)}</span>
          </span>

          {#if protocolVersion > 0}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-elevated border border-surface-raised text-text-muted">
              <span class="text-accent-violet font-medium">Protocol</span>
              v{protocolVersion}
            </span>
          {/if}

          {#if layerCount > 0}
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-elevated border border-surface-raised text-text-muted">
              <span class="text-accent-cyan font-medium">{layerCount}</span>
              {layerCount === 1 ? 'Layer' : 'Layers'}
            </span>
          {/if}

          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-elevated border border-surface-raised">
            <span class="text-accent-amber font-medium">{pendingChanges}</span>
            {pendingChanges === 1 ? 'Change' : 'Changes'}
          </span>
        </div>
      {/if}
    </div>

    {#if showLayers && layerCount > 0}
      <div class="flex items-center" role="toolbar" aria-label="Layer selector">
        <LayerSelector />
      </div>
    {/if}
  </div>
</header>
