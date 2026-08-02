<script lang="ts">
  import ConnectBar from './ui/ConnectBar.svelte';
  import TabBar from './ui/TabBar.svelte';
  import LayerSelector from './ui/keymap/LayerSelector.svelte';
  import KeymapGrid from './ui/keymap/KeymapGrid.svelte';
  import KeycodePicker from './ui/keymap/KeycodePicker.svelte';
  import EncoderEditor from './ui/encoder/EncoderEditor.svelte';
  import MacroEditor from './ui/macro/MacroEditor.svelte';
  import LightingPanel from './ui/lighting/LightingPanel.svelte';
  import LayoutOptions from './ui/layout/LayoutOptions.svelte';
  import PacketLog from './ui/console/PacketLog.svelte';
  import Toast from './ui/shared/Toast.svelte';

  import { BLETransport } from './ble/transport';
  import { setTransport } from './ble/dispatch';
  import { Protocol } from './core/protocol';
  import { parseV3Definition } from './core/v3-definition';
  import { type RawPacket } from './core/protocol';
  import {
    getActiveTab,
    setDefinition,
    setConnectionState,
    addPacketLog,
    setLayerCount,
    setKeymap,
    setKeymapAtIndex,
    setEncoderCount,
    setEncoderMap,
  } from './store/app.svelte';

  let transport: BLETransport | null = null;

  function handleResponse(pkt: RawPacket) {
    addPacketLog('rx', pkt);
    if (pkt.length === 0) return;

    const cmd = pkt[0]!;
    // 0x11: layer count response — byte 1 = count
    if (cmd === 0x11) {
      setLayerCount(pkt[1] ?? 1);
      return;
    }
    // 0x12: keymap buffer response — offset(2B), size(1B), data
    if (cmd === 0x12) {
      const offset = (pkt[1] ?? 0) | ((pkt[2] ?? 0) << 8);
      const size = pkt[3] ?? 0;
      for (let i = 0; i < size; i++) {
        const idx = offset + i;
        // ponytail: direct mutation via setKeymapAtIndex, Svelte $state proxy handles reactivity
        setKeymapAtIndex(idx, pkt[4 + i] ?? 0);
      }
      return;
    }
  }

  async function handleConnect() {
    transport = new BLETransport();
    transport.onStateChange = (s) => setConnectionState(s);
    transport.onResponse = handleResponse;
    await transport.connect();
    setTransport(transport);

    // Handshake
    const handshake = Protocol.getProtocolVersion();
    transport.send(handshake);
    addPacketLog('tx', handshake);

    // Read device info
    const info = await transport.readInfo();
    if (info) addPacketLog('rx', info);

    // Read layer count
    transport.send(Protocol.getLayerCount());
    addPacketLog('tx', Protocol.getLayerCount());
  }

  function handleDisconnect() {
    transport?.disconnect();
    setTransport(null);
    transport = null;
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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const def = parseV3Definition(reader.result as string);
        setDefinition(def);

        const rows = def.matrix.rows;
        const cols = def.matrix.cols;
        const keyCount = rows * cols;
        // ponytail: hardcoded 4 layers until protocol response sets real count
        setLayerCount(4);
        setKeymap(new Array(4 * keyCount).fill(0));

        if (def.encoders) {
          setEncoderCount(def.encoders);
          setEncoderMap(new Array(4 * def.encoders * 2).fill(0));
        }
      } catch {
        // ponytail: silent skip, wire toast if UX demands
      }
    };
    reader.readAsText(file);
  }

  const activeTab = $derived(getActiveTab());
</script>

<div
  class="h-screen flex flex-col bg-slate-50 text-slate-700"
  role="application"
  ondrop={handleDrop}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
>
  <ConnectBar onConnect={handleConnect} onDisconnect={handleDisconnect} />

  <TabBar />

  {#if activeTab === 'keymap' || activeTab === 'encoder'}
    <LayerSelector />
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
    {:else if activeTab === 'layout'}
      <LayoutOptions />
    {:else if activeTab === 'console'}
      <PacketLog />
    {/if}
  </div>

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
