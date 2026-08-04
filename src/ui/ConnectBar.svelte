<script lang="ts">
  import { getConnectionState, getSyncPhase, getSyncProgress, getDeviceName, setConnectionState, getSaveState, markSaving, markSaved, markSaveFailed } from '../store/app.svelte';
  import type { TransportState } from '../ble/transport';
  import { Protocol } from '../core/protocol';
  import { sendViaCommand } from '../ble/dispatch';
  import Icon from './shared/Icon.svelte';

  let { onConnect, onDisconnect }: {
    onConnect: () => Promise<void>;
    onDisconnect: () => Promise<void>;
  } = $props();

  let errorState = $state('');
  let isConnecting = $state(false);

  const connState = $derived(getConnectionState());

  const stateDot: Record<TransportState, string> = {
    connected: 'bg-accent-lime',
    connecting: 'bg-accent-amber animate-pulse',
    error: 'bg-accent-red',
    disconnected: 'bg-text-dimmed',
  };

  function stateLabel(s: TransportState): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  const saveState = $derived(getSaveState());

  async function handleSave() {
    markSaving();
    try {
      await sendViaCommand(Protocol.saveCustomValue(0x02));
      markSaved();
    } catch {
      markSaveFailed();
    }
  }

  async function handleConnect() {
    errorState = '';
    isConnecting = true;
    setConnectionState('connecting');
    try {
      await onConnect();
    } catch (e) {
      errorState = e instanceof Error ? e.message : 'Connection failed';
      setConnectionState('error');
    } finally {
      isConnecting = false;
    }
  }

  function handleDisconnect() {
    onDisconnect();
    errorState = '';
  }
</script>

<!-- Mobile header -->
<div class="md:hidden bg-surface-dark border-b border-surface-raised px-4 py-2 flex items-center justify-between">
  <div class="flex items-center gap-2.5 min-w-0">
    <span class="text-sm font-bold text-accent-cyan tracking-wider shrink-0">AirVIA</span>
    <div class="flex items-center gap-1.5">
      <span class="inline-block w-2 h-2 rounded-full {stateDot[connState]}" aria-label={connState}></span>
      <span class="text-[0.65rem] text-text-muted">{stateLabel(connState)}</span>
    </div>
    {#if connState === 'connected'}
      <span class="text-[0.65rem] text-text-primary truncate">{getDeviceName() || 'VIA Keyboard'}</span>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    {#if errorState}
      <span class="text-xs text-accent-red max-w-32 truncate" title={errorState}>{errorState}</span>
    {/if}

    {#if saveState === 'dirty'}
      <button onclick={handleSave}
        disabled={connState !== 'connected'}
        class="px-2.5 py-1 bg-accent-cyan text-bg-dark rounded-lg text-xs font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors">
        Save
      </button>
    {:else if saveState === 'saving'}
      <span class="text-xs text-text-muted">Saving...</span>
    {:else if saveState === 'saved'}
      <span class="text-xs text-accent-lime">&#10003;</span>
    {:else if saveState === 'failed'}
      <button onclick={handleSave}
        disabled={connState !== 'connected'}
        class="text-xs text-accent-red hover:underline disabled:opacity-50">
        Retry
      </button>
    {/if}

    {#if connState === 'disconnected' || connState === 'error'}
      <button
        onclick={handleConnect}
        disabled={isConnecting}
        class="flex items-center justify-center p-1.5 bg-surface-raised hover:bg-surface-elevated disabled:opacity-50 rounded-lg text-text-primary transition-colors"
        title="Connect"
      >
        <Icon name="bluetooth" class="w-3.5 h-3.5" />
      </button>
    {:else}
      <button
        onclick={handleDisconnect}
        class="flex items-center justify-center p-1.5 bg-surface-raised text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
        title="Disconnect"
      >
        <Icon name="disconnect" class="w-3.5 h-3.5" />
      </button>
    {/if}
  </div>
</div>

<!-- Desktop device card -->
<div class="hidden md:block bg-surface-dark border-b border-surface-raised p-4">
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="text-lg font-bold text-accent-cyan tracking-wider">AirVIA</span>
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised">
        <span class="inline-block w-2 h-2 rounded-full {stateDot[connState]}" aria-label={connState}></span>
        <span class="text-[0.65rem] font-medium text-text-muted uppercase tracking-wider">{stateLabel(connState)}</span>
      </span>
    </div>

    {#if connState === 'connected'}
      <div class="flex flex-col gap-1 px-2.5 py-2 rounded-lg bg-surface-elevated border border-surface-raised">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted">Device</span>
          <span class="text-sm font-medium text-text-primary">{getDeviceName() || 'VIA Keyboard'}</span>
        </div>
        {#if getSyncPhase() === 'syncing'}
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Syncing</span>
            <span class="text-xs text-accent-cyan animate-pulse">{getSyncProgress()}</span>
          </div>
        {:else if getSyncPhase() === 'ready'}
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Status</span>
            <span class="text-xs text-accent-lime">Ready</span>
          </div>
        {:else if getSyncPhase() === 'error'}
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Status</span>
            <span class="text-xs text-accent-red">{getSyncProgress()}</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if errorState}
      <div class="px-2.5 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20">
        <span class="text-xs text-accent-red">{errorState}</span>
      </div>
    {/if}

    <div class="flex items-center gap-2">
      {#if saveState === 'dirty'}
        <button onclick={handleSave}
          disabled={connState !== 'connected'}
          class="flex-1 px-3 py-1.5 bg-accent-cyan text-bg-dark rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors">
          Save to Device
        </button>
      {:else if saveState === 'saving'}
        <span class="flex-1 px-3 py-1.5 text-center text-sm text-text-muted rounded-lg bg-surface-elevated">Saving...</span>
      {:else if saveState === 'saved'}
        <span class="flex-1 px-3 py-1.5 text-center text-sm text-accent-lime rounded-lg bg-accent-lime/10">Saved</span>
      {:else if saveState === 'failed'}
        <button onclick={handleSave}
          disabled={connState !== 'connected'}
          class="flex-1 px-3 py-1.5 text-sm text-accent-red hover:underline disabled:opacity-50 rounded-lg bg-accent-red/10">
          Save failed — Retry
        </button>
      {:else}
        <div class="flex-1 px-3 py-1.5 text-center text-sm text-text-dimmed rounded-lg bg-surface-elevated select-none">No changes</div>
      {/if}

      {#if connState === 'disconnected' || connState === 'error'}
        <button
          onclick={handleConnect}
          disabled={isConnecting}
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-raised hover:bg-surface-elevated disabled:opacity-50 rounded-lg text-text-primary text-sm font-medium transition-colors"
        >
          <Icon name="bluetooth" class="w-4 h-4" />
          Connect
        </button>
      {:else}
        <button
          onclick={handleDisconnect}
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-raised text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg text-sm transition-colors"
        >
          <Icon name="disconnect" class="w-4 h-4" />
          Disconnect
        </button>
      {/if}
    </div>
  </div>
</div>
