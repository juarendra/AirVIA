<script lang="ts">
  import ConnectBar from './ui/ConnectBar.svelte';
  import TabBar from './ui/TabBar.svelte';
  import WorkspaceHeader from './ui/layout/WorkspaceHeader.svelte';
  import KeymapGrid from './ui/keymap/KeymapGrid.svelte';
  import KeycodePicker from './ui/keymap/KeycodePicker.svelte';
  import EncoderEditor from './ui/encoder/EncoderEditor.svelte';
  import MacroEditor from './ui/macro/MacroEditor.svelte';
  import LightingPanel from './ui/lighting/LightingPanel.svelte';
  import LayoutOptions from './ui/layout/LayoutOptions.svelte';
  import PacketLog from './ui/console/PacketLog.svelte';
  import DeviceActions from './ui/device/DeviceActions.svelte';
  import Toast from './ui/shared/Toast.svelte';
  import BrowserCheck from './ui/shared/BrowserCheck.svelte';
  import ProfileManager from './ui/profile/ProfileManager.svelte';
  import { toast } from './ui/shared/Toast.svelte';

  import { BLETransport } from './ble/transport';
  import { setTransport } from './ble/dispatch';
  import { synchronizeDevice } from './device/synchronizer';
  import { parseV3Definition } from './core/v3-definition';
  import {
    getActiveTab,
    setDefinition,
    setConnectionState,
    addPacketLog,
    setLayerCount,
    setKeymap,
    setEncoderCount,
    setEncoderMap,
    setDeviceName,
    setSyncPhase,
    setSyncProgress,
    resetDeviceState,
    getDefinition,
    setMacroCount,
    setMacroBytes,
    markStale
  } from './store/app.svelte';

  let transport: BLETransport | null = null;

  async function handleConnect() {
    if (!getDefinition()) {
      toast('Please load a definition file first', 'error');
      return;
    }

    transport = new BLETransport();
    transport.onStateChange = (s) => {
      setConnectionState(s);
      if (s === 'disconnected') {
        setTransport(null);
        // ponytail: mark stale on unexpected disconnects to lock editors, user can reset via ConnectBar later
        markStale();
      }
    };
    transport.onResponse = (pkt) => addPacketLog('rx', pkt);

    try {
      await transport.connect();
    } catch (err) {
      toast('Connection failed', 'error');
      transport = null;
      return;
    }

    setTransport(transport);

    const info = await transport.readInfo();
    if (info) {
      addPacketLog('rx', info);
      const nameBytes = info.slice(4).filter(b => b !== 0);
      if (nameBytes.length > 0) {
        setDeviceName(String.fromCharCode(...nameBytes));
      }
    }

    try {
      const snapshot = await synchronizeDevice();
      setLayerCount(snapshot.layers);
      setKeymap(snapshot.keymap);
      
      if (snapshot.encoders) {
        setEncoderCount(getDefinition()!.encoders ?? 0);
        setEncoderMap(snapshot.encoders);
      } else {
        setEncoderCount(0);
        setEncoderMap(null);
      }

      if (snapshot.macros) {
        setMacroCount(snapshot.macros.count);
        setMacroBytes(snapshot.macros.bytes);
      } else {
        setMacroCount(null);
        setMacroBytes(null);
      }

      toast('Synchronized', 'success');
    } catch (err) {
      console.error('Sync failed:', err);
      toast('Sync failed', 'error');
      setSyncPhase('error');
      setSyncProgress('Sync failed — try reconnecting');
      return;
    }
  }

  async function handleDisconnect() {
    await transport?.disconnect();
    setTransport(null);
    transport = null;
    resetDeviceState();
  }

  let fileInput: HTMLInputElement;
  let dragOver = $state(false);

  function triggerFileInput() {
    fileInput.click();
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    readDefinitionFile(file);
    input.value = '';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) readDefinitionFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function readDefinitionFile(file: File) {
    if (file.size > 1024 * 1024) {
      toast('Definition file too large', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const def = parseV3Definition(reader.result as string);
        setDefinition(def);

        if (transport) {
          // Changed def while connected, force disconnect to re-verify matrix
          toast('Definition changed, disconnecting to re-sync', 'error');
          await handleDisconnect();
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          toast(`Invalid definition: ${e.message}`, 'error');
        } else {
          toast('Invalid definition', 'error');
        }
      }
    };
    reader.readAsText(file);
  }

  const activeTab = $derived(getActiveTab());
</script>

<BrowserCheck>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="h-[100dvh] flex flex-col md:flex-row bg-bg-dark text-text-primary"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
  >
    <!-- Desktop sidebar rail -->
    <aside class="hidden md:flex md:w-60 md:min-w-[240px] bg-surface-dark border-r border-surface-raised flex-col">
      <ConnectBar onConnect={handleConnect} onDisconnect={handleDisconnect} />
      <div class="flex-1 overflow-y-auto">
        <TabBar />
      </div>
    </aside>

    <!-- Mobile connect header -->
    <div class="md:hidden">
      <ConnectBar onConnect={handleConnect} onDisconnect={handleDisconnect} />
    </div>

    <!-- Main Editor Area -->
    <main class="flex-1 flex flex-col min-w-0 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      {#if activeTab !== 'manual'}
        <WorkspaceHeader />
      {:else}
        <div class="bg-surface-dark border-b border-surface-raised px-4 py-3 md:px-5 md:py-4">
          <h1 class="text-base md:text-lg font-bold text-text-primary">Manual Pengguna</h1>
        </div>
      {/if}

      <div class="flex-1 min-h-0">
        {#if activeTab === 'keymap'}
          <KeymapGrid />
        {:else if activeTab === 'encoder'}
          <EncoderEditor />
        {:else if activeTab === 'macros'}
          <MacroEditor />
        {:else if activeTab === 'lighting'}
          <LightingPanel />
        {:else if activeTab === 'profiles'}
          <ProfileManager />
        {:else if activeTab === 'layout'}
          <LayoutOptions />
        {:else if activeTab === 'actions'}
          <DeviceActions />
        {:else if activeTab === 'console'}
          <PacketLog />
        {:else if activeTab === 'manual'}
          <div class="flex items-center justify-center h-full text-text-muted text-sm">Manual pengguna akan tersedia segera.</div>
        {/if}
      </div>
    </main>

    {#if dragOver}
      <div class="fixed inset-0 bg-black/20 border-2 border-dashed border-blue-400 z-40 pointer-events-none flex items-center justify-center">
        <span class="text-2xl text-blue-500 font-bold">Drop V3 definition JSON</span>
      </div>
    {/if}

    <input
      type="file"
      accept=".json,application/json"
      bind:this={fileInput}
      onchange={handleFileChange}
      class="hidden"
    />

    <button
      onclick={triggerFileInput}
      class="fixed bottom-4 left-4 z-50 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:border-slate-400 shadow-sm transition-colors"
      title="Load V3 definition JSON"
    >
      Load definition JSON
    </button>

    <Toast />
    <KeycodePicker />
  </div>
</BrowserCheck>
