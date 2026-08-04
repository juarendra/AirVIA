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

  const stateDot = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
    disconnected: 'bg-slate-300',
  } as Record<TransportState, string>;

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

<div class="bg-surface-dark border-b border-surface-raised px-4 py-3 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <span class="text-lg font-bold text-accent-cyan tracking-wider">AirVIA</span>
    <div class="flex items-center gap-1.5">
      <span class="inline-block w-2 h-2 rounded-full {stateDot[connState]}" aria-label={connState}></span>
      <span class="text-xs text-text-muted px-2 py-0.5 rounded-full bg-surface-elevated font-medium">{stateLabel(connState)}</span>
    </div>
    {#if connState === 'connected' || getSyncPhase() === 'syncing' || getSyncPhase() === 'ready'}
      <span class="text-xs text-text-primary ml-1">{getDeviceName() || 'VIA Keyboard'}</span>
      {#if getSyncPhase() === 'syncing'}
        <span class="text-xs text-accent-cyan animate-pulse">{getSyncProgress()}</span>
      {:else if getSyncPhase() === 'ready'}
        <span class="text-xs text-accent-lime">Ready</span>
      {:else if getSyncPhase() === 'error'}
        <span class="text-xs text-accent-red">{getSyncProgress()}</span>
      {/if}
    {/if}
  </div>

  <div class="flex items-center gap-3">
    {#if errorState}
      <span class="text-sm text-accent-red max-w-64 truncate" title={errorState}>{errorState}</span>
    {/if}

    {#if saveState === 'dirty'}
      <button onclick={handleSave}
        disabled={connState !== 'connected'}
        class="px-3 py-1.5 bg-accent-cyan text-bg-dark rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors">
        Save
      </button>
    {:else if saveState === 'saving'}
      <span class="text-sm text-text-muted">Saving...</span>
    {:else if saveState === 'saved'}
      <span class="text-sm text-accent-lime">&#10003;</span>
    {:else if saveState === 'failed'}
      <button onclick={handleSave}
        disabled={connState !== 'connected'}
        class="text-sm text-accent-red hover:underline disabled:opacity-50">
        Retry
      </button>
    {/if}

    {#if connState === 'disconnected' || connState === 'error'}
      <button
        onclick={handleConnect}
        disabled={isConnecting}
        class="flex items-center justify-center p-2 bg-surface-raised hover:bg-surface-elevated disabled:opacity-50 rounded-lg text-text-primary transition-colors"
        title="Connect"
      >
        <Icon name="bluetooth" class="w-4 h-4" />
      </button>
    {:else}
      <button
        onclick={handleDisconnect}
        class="flex items-center justify-center p-2 bg-surface-raised text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
        title="Disconnect"
      >
        <Icon name="disconnect" class="w-4 h-4" />
      </button>
    {/if}
  </div>
</div>
