<script lang="ts">
  import JoystickMonitor from './JoystickMonitor.svelte';
  import { KEYCODES_BY_CATEGORY, type KeycodeEntry } from '../../core/keycodes';
  import {
    actionLabel,
    type OrthoPadAction,
    type OrthoPadEncoderAction,
  } from '../../device/orthopad';
  import {
    applyOrthoPadConfig,
    discardOrthoPadChanges,
    getOrthoPadBusy,
    getOrthoPadConfig,
    getOrthoPadActiveLayer,
    getOrthoPadConnectionState,
    getOrthoPadDirty,
    getOrthoPadError,
    getOrthoPadInfo,
    getOrthoPadMessage,
    resetOrthoPadDefaults,
    setOrthoPadAction,
    setOrthoPadActiveLayer,
    setOrthoPadEncoderAction,
    setOrthoPadConnectionState,
    setOrthoPadError,
    setOrthoPadSettings,
  } from '../../store/orthopad.svelte';

  let { onConnect, onDisconnect }: {
    onConnect: () => Promise<void>;
    onDisconnect: () => Promise<void>;
  } = $props();

  const keyEntries: KeycodeEntry[] = Object.values(KEYCODES_BY_CATEGORY).flat().filter(entry => entry.code <= 0xff);
  const modifierOptions = [
    { value: 0, label: 'No modifier' },
    { value: 1, label: 'Ctrl' },
    { value: 2, label: 'Shift' },
    { value: 4, label: 'Alt' },
    { value: 8, label: 'GUI' },
  ];

  const state = $derived(getOrthoPadConnectionState());
  const config = $derived(getOrthoPadConfig());
  const info = $derived(getOrthoPadInfo());
  const activeLayer = $derived(getOrthoPadActiveLayer());
  const dirty = $derived(getOrthoPadDirty());
  const busy = $derived(getOrthoPadBusy());
  const message = $derived(getOrthoPadMessage());
  const error = $derived(getOrthoPadError());

  function stateLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function keyActionValue(action: OrthoPadAction): string {
    return action.type === 'none' ? '0' : String(action.keycode);
  }

  function encoderActionValue(action: OrthoPadEncoderAction): string {
    if (action.type === 'none') return 'none';
    if (action.type === 'wheel') return `wheel:${action.amount}`;
    return `key:${action.keycode}`;
  }

  function parseKeyAction(event: Event, button: number): void {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    const current = config?.keymap[activeLayer]?.[button];
    setOrthoPadAction(activeLayer, button, {
      type: value === 0 ? 'none' : 'key',
      keycode: value,
      modifiers: current?.modifiers ?? 0,
    });
  }

  function parseModifier(event: Event, button: number): void {
    const modifiers = Number((event.currentTarget as HTMLSelectElement).value);
    const current = config?.keymap[activeLayer]?.[button];
    if (!current) return;
    setOrthoPadAction(activeLayer, button, { ...current, modifiers });
  }

  function parseEncoderAction(event: Event, clockwise: boolean): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value === 'none') {
      setOrthoPadEncoderAction(activeLayer, clockwise, { type: 'none', keycode: 0, modifiers: 0 });
    } else if (value.startsWith('wheel:')) {
      setOrthoPadEncoderAction(activeLayer, clockwise, {
        type: 'wheel', amount: Number(value.slice(6)), keycode: 0, modifiers: 0,
      });
    } else {
      setOrthoPadEncoderAction(activeLayer, clockwise, {
        type: 'key', keycode: Number(value.slice(4)), modifiers: 0,
      });
    }
  }

  function numberValue(event: Event): number {
    return Number((event.currentTarget as HTMLInputElement).value);
  }

  async function connect(): Promise<void> {
    try {
      await onConnect();
    } catch (reason) {
      setOrthoPadConnectionState('error');
      setOrthoPadError(reason instanceof Error ? reason.message : 'Connection failed');
    }
  }

  async function save(): Promise<void> {
    try { await applyOrthoPadConfig(); } catch { /* error is displayed by the store */ }
  }

  async function discard(): Promise<void> {
    try { await discardOrthoPadChanges(); } catch { /* error is displayed by the store */ }
  }

  async function resetDefaults(): Promise<void> {
    try { await resetOrthoPadDefaults(); } catch { /* error is displayed by the store */ }
  }
</script>

<div class="flex flex-col h-full overflow-y-auto p-4 md:p-6 gap-5">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-widest text-accent-cyan">OrthoPad CAD</p>
      <h1 class="text-xl font-bold text-text-primary">USB configuration</h1>
      <p class="text-sm text-text-muted">PlatformIO firmware · WebSerial transport</p>
    </div>
    <div class="flex items-center gap-2">
      <span class="px-2.5 py-1 rounded-full bg-surface-raised text-xs text-text-muted">{stateLabel(state)}</span>
      {#if state === 'disconnected' || state === 'error'}
        <button class="px-3 py-2 rounded-lg bg-accent-cyan text-bg-dark text-sm font-semibold disabled:opacity-50" onclick={connect} disabled={busy}>Connect OrthoPad</button>
      {:else}
        <button class="px-3 py-2 rounded-lg bg-surface-raised text-sm text-text-primary" onclick={onDisconnect} disabled={busy}>Disconnect</button>
      {/if}
    </div>
  </div>

  {#if error}
    <div class="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">{error}</div>
  {/if}
  {#if message}
    <div class="rounded-lg border border-surface-raised bg-surface-dark px-3 py-2 text-sm text-text-muted">{message}</div>
  {/if}

  {#if info}
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
      <div class="rounded-lg bg-surface-dark border border-surface-raised p-3"><span class="text-text-dimmed">Device</span><br />{info.deviceName}</div>
      <div class="rounded-lg bg-surface-dark border border-surface-raised p-3"><span class="text-text-dimmed">Firmware</span><br />{info.firmwareVersion}</div>
      <div class="rounded-lg bg-surface-dark border border-surface-raised p-3"><span class="text-text-dimmed">Protocol</span><br />{info.protocolMajor}.{info.protocolMinor}</div>
      <div class="rounded-lg bg-surface-dark border border-surface-raised p-3"><span class="text-text-dimmed">Layers</span><br />{info.layers}</div>
      <div class="rounded-lg bg-surface-dark border border-surface-raised p-3"><span class="text-text-dimmed">Schema</span><br />{info.configSchema}</div>
    </div>
  {/if}

  <JoystickMonitor />
  {#if config}
    <section class="rounded-xl border border-surface-raised bg-surface-dark p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-text-primary">Keymap</h2>
          <p class="text-xs text-text-muted">Edit tombol tanpa reflash firmware.</p>
        </div>
        <div class="flex gap-1" role="tablist" aria-label="OrthoPad layers">
          {#each ['Core', 'Sketch', 'Modify'] as label, layer}
            <button
              class="px-3 py-1.5 rounded-lg text-xs {activeLayer === layer ? 'bg-accent-cyan text-bg-dark' : 'bg-surface-raised text-text-muted'}"
              onclick={() => setOrthoPadActiveLayer(layer)}
              aria-selected={activeLayer === layer}
              role="tab"
            >{label}</button>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        {#each config.keymap[activeLayer] ?? [] as action, button}
          <div class="rounded-lg border border-surface-raised p-3 space-y-2">
            <div class="text-xs text-text-dimmed">BTN{button + 1}</div>
            <select class="w-full bg-surface-elevated rounded-md p-2 text-xs" value={keyActionValue(action)} onchange={(event) => parseKeyAction(event, button)} aria-label={`BTN${button + 1} key`}>
              <option value="0">None</option>
              {#each keyEntries as entry}
                <option value={entry.code}>{entry.label}</option>
              {/each}
            </select>
            <select class="w-full bg-surface-elevated rounded-md p-2 text-xs" value={action.modifiers} onchange={(event) => parseModifier(event, button)} aria-label={`BTN${button + 1} modifier`}>
              {#each modifierOptions as modifier}
                <option value={modifier.value}>{modifier.label}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
    </section>

    <section class="rounded-xl border border-surface-raised bg-surface-dark p-4 space-y-4">
      <div>
        <h2 class="font-semibold text-text-primary">Encoder</h2>
        <p class="text-xs text-text-muted">Mapping per layer. Switch encoder tetap dipakai untuk right-click/layer gesture pada MVP.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each [{ label: 'Clockwise', clockwise: true }, { label: 'Counter-clockwise', clockwise: false }] as direction}
          {@const action = direction.clockwise ? config.encoders[activeLayer]?.clockwise : config.encoders[activeLayer]?.counterClockwise}
          {#if action}
            <label class="rounded-lg border border-surface-raised p-3 space-y-2 text-sm">
              <span class="text-text-muted">{direction.label}</span>
              <select class="w-full bg-surface-elevated rounded-md p-2 text-xs" value={encoderActionValue(action)} onchange={(event) => parseEncoderAction(event, direction.clockwise)}>
                <option value="none">None</option>
                <option value="wheel:1">Wheel +1</option>
                <option value="wheel:-1">Wheel -1</option>
                {#each keyEntries as entry}
                  <option value={`key:${entry.code}`}>{entry.label}</option>
                {/each}
              </select>
              <span class="text-xs text-text-dimmed">Current: {actionLabel(action)}</span>
            </label>
          {/if}
        {/each}
      </div>
    </section>

    <section class="rounded-xl border border-surface-raised bg-surface-dark p-4 space-y-4">
      <div>
        <h2 class="font-semibold text-text-primary">CAD settings</h2>
        <p class="text-xs text-text-muted">Draft tersimpan di browser sampai Apply &amp; Save ditekan.</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label class="text-xs text-text-muted">Center X<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="0" max="1023" value={config.settings.centerX} onchange={(event) => setOrthoPadSettings({ centerX: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Center Y<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="0" max="1023" value={config.settings.centerY} onchange={(event) => setOrthoPadSettings({ centerY: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Deadzone<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="0" max="512" value={config.settings.deadzone} onchange={(event) => setOrthoPadSettings({ deadzone: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Speed ×1000<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="1" max="10000" value={config.settings.speedMilli} onchange={(event) => setOrthoPadSettings({ speedMilli: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Curve ×1000<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="100" max="5000" value={config.settings.curveMilli} onchange={(event) => setOrthoPadSettings({ curveMilli: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Tap (ms)<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="50" max="1000" value={config.settings.tapMs} onchange={(event) => setOrthoPadSettings({ tapMs: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Hold (ms)<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="100" max="2000" value={config.settings.holdMs} onchange={(event) => setOrthoPadSettings({ holdMs: numberValue(event) })} /></label>
        <label class="text-xs text-text-muted">Wheel step<input class="mt-1 w-full bg-surface-elevated rounded-md p-2 text-text-primary" type="number" min="1" max="10" value={config.settings.wheelStep} onchange={(event) => setOrthoPadSettings({ wheelStep: numberValue(event) })} /></label>
      </div>
      <div class="flex flex-wrap gap-4 text-sm text-text-muted">
        <label class="inline-flex items-center gap-2"><input type="checkbox" checked={config.settings.invertX} onchange={(event) => setOrthoPadSettings({ invertX: (event.currentTarget as HTMLInputElement).checked })} />Invert X</label>
        <label class="inline-flex items-center gap-2"><input type="checkbox" checked={config.settings.invertY} onchange={(event) => setOrthoPadSettings({ invertY: (event.currentTarget as HTMLInputElement).checked })} />Invert Y</label>
        <label class="inline-flex items-center gap-2"><input type="number" min="50" max="2000" value={config.settings.encoderTapMs} onchange={(event) => setOrthoPadSettings({ encoderTapMs: numberValue(event) })} class="w-24 bg-surface-elevated rounded-md p-1 text-text-primary" />Encoder tap ms</label>
        <label class="inline-flex items-center gap-2"><input type="number" min="100" max="3000" value={config.settings.layerHoldMs} onchange={(event) => setOrthoPadSettings({ layerHoldMs: numberValue(event) })} class="w-24 bg-surface-elevated rounded-md p-1 text-text-primary" />Layer hold ms</label>
        <label class="inline-flex items-center gap-2">Encoder direction<select class="bg-surface-elevated rounded-md p-1 text-text-primary" value={config.settings.encoderDirection} onchange={(event) => setOrthoPadSettings({ encoderDirection: Number((event.currentTarget as HTMLSelectElement).value) === -1 ? -1 : 1 })}><option value="1">Normal</option><option value="-1">Reverse</option></select></label>
        <label class="inline-flex items-center gap-2">Pan modifier<select class="bg-surface-elevated rounded-md p-1 text-text-primary" value={config.settings.panModifier} onchange={(event) => setOrthoPadSettings({ panModifier: Number((event.currentTarget as HTMLSelectElement).value) })}><option value="0">None</option><option value="1">Ctrl</option><option value="2">Shift</option><option value="4">Alt</option><option value="8">GUI</option></select></label>
      </div>
    </section>

    <div class="flex flex-wrap items-center justify-end gap-2">
      <button class="px-3 py-2 rounded-lg bg-surface-raised text-sm text-text-muted disabled:opacity-50" onclick={resetDefaults} disabled={busy}>Restore defaults</button>
      <button class="px-3 py-2 rounded-lg bg-surface-raised text-sm text-text-muted disabled:opacity-50" onclick={discard} disabled={!dirty || busy}>Discard draft</button>
      <button class="px-4 py-2 rounded-lg bg-accent-cyan text-bg-dark text-sm font-semibold disabled:opacity-50" onclick={save} disabled={!dirty || busy}>{busy ? 'Saving...' : 'Apply & Save'}</button>
    </div>
  {:else}
    <div class="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-surface-raised text-sm text-text-muted">Connect OrthoPad untuk membaca konfigurasi.</div>
  {/if}
</div>
