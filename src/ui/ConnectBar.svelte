<script lang="ts">
  import { getConnectionState, setConnectionState } from '../store/app.svelte';
  import type { TransportState } from '../ble/transport';
  import Icon from './shared/Icon.svelte';

  let { onConnect, onDisconnect }: {
    onConnect: () => Promise<void>;
    onDisconnect: () => void;
  } = $props();

  let error = $state<string | null>(null);
  let connecting = $state(false);

  const stateDot: Record<TransportState, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
    disconnected: 'bg-slate-300',
  };

  function stateLabel(s: TransportState): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function handleConnect() {
    error = null;
    connecting = true;
    setConnectionState('connecting');
    try {
      await onConnect();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Connection failed';
      setConnectionState('error');
    } finally {
      connecting = false;
    }
  }

  function handleDisconnect() {
    onDisconnect();
    error = null;
  }

  const state = $derived(getConnectionState());
</script>

<div class="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <span class="text-lg font-bold text-blue-600">AirVIA</span>
    <div class="flex items-center gap-1.5">
      <span class="inline-block w-2.5 h-2.5 rounded-full {stateDot[state]}" aria-label={state}></span>
      <span class="text-sm text-slate-500 px-3 py-0.5 rounded-full bg-slate-100 text-xs font-medium">{stateLabel(state)}</span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    {#if error}
      <span class="text-sm text-red-400 max-w-64 truncate" title={error}>{error}</span>
    {/if}
    {#if state === 'disconnected' || state === 'error'}
      <button
        onclick={handleConnect}
        disabled={connecting}
        class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
      >
        <Icon name="bluetooth" class="w-4 h-4" />
        Connect
      </button>
    {:else}
      <button
        onclick={handleDisconnect}
        class="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full text-sm font-medium shadow-sm transition-all"
      >
        <Icon name="disconnect" class="w-4 h-4" />
        Disconnect
      </button>
    {/if}
  </div>
</div>
