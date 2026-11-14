import type {
  OrthoPadAction,
  OrthoPadBackend,
  OrthoPadCadSettings,
  OrthoPadConfig,
  OrthoPadEncoderAction,
  OrthoPadEncoderLayer,
  OrthoPadInfo,
} from '../device/orthopad';
import type { SerialTransportState } from '../serial/transport';

let backend = $state<OrthoPadBackend | null>(null);
let connectionState = $state<SerialTransportState>('disconnected');
let info = $state<OrthoPadInfo | null>(null);
let config = $state<OrthoPadConfig | null>(null);
let activeLayer = $state(0);
let dirty = $state(false);
let busy = $state(false);
let message = $state('');
let error = $state('');

export function getOrthoPadBackend(): OrthoPadBackend | null { return backend; }
export function setOrthoPadBackend(value: OrthoPadBackend | null): void { backend = value; }
export function getOrthoPadConnectionState(): SerialTransportState { return connectionState; }
export function setOrthoPadConnectionState(value: SerialTransportState): void { connectionState = value; }
export function setOrthoPadError(value: string): void { error = value; }
export function getOrthoPadInfo(): OrthoPadInfo | null { return info; }
export function getOrthoPadConfig(): OrthoPadConfig | null { return config; }
export function getOrthoPadActiveLayer(): number { return activeLayer; }
export function setOrthoPadActiveLayer(value: number): void { activeLayer = Math.max(0, Math.min(2, value)); }
export function getOrthoPadDirty(): boolean { return dirty; }
export function getOrthoPadBusy(): boolean { return busy; }
export function getOrthoPadMessage(): string { return message; }
export function getOrthoPadError(): string { return error; }

export function setOrthoPadSnapshot(nextInfo: OrthoPadInfo, nextConfig: OrthoPadConfig): void {
  info = nextInfo;
  config = nextConfig;
  activeLayer = 0;
  dirty = false;
  message = 'Device synchronized';
  error = '';
}

export function clearOrthoPadState(): void {
  backend = null;
  connectionState = 'disconnected';
  info = null;
  config = null;
  activeLayer = 0;
  dirty = false;
  busy = false;
  message = '';
  error = '';
}

export function setOrthoPadAction(layer: number, button: number, action: OrthoPadAction): void {
  if (!config || !config.keymap[layer]) return;
  const keymap = config.keymap.map((current, index) => index === layer
    ? current.map((item, itemIndex) => itemIndex === button ? action : item)
    : current);
  config = { ...config, keymap };
  dirty = true;
  message = 'Unsaved changes';
  error = '';
}

export function setOrthoPadEncoderAction(layer: number, clockwise: boolean, action: OrthoPadEncoderAction): void {
  if (!config || !config.encoders[layer]) return;
  const encoders = config.encoders.map((current, index) => {
    if (index !== layer) return current;
    return clockwise ? { ...current, clockwise: action } : { ...current, counterClockwise: action };
  });
  config = { ...config, encoders };
  dirty = true;
  message = 'Unsaved changes';
  error = '';
}

export function setOrthoPadSettings(patch: Partial<OrthoPadCadSettings>): void {
  if (!config) return;
  config = { ...config, settings: { ...config.settings, ...patch } };
  dirty = true;
  message = 'Unsaved changes';
  error = '';
}

export async function applyOrthoPadConfig(): Promise<void> {
  if (!backend || !config) throw new Error('OrthoPad is not synchronized');
  busy = true;
  error = '';
  message = 'Writing configuration...';
  try {
    for (let layer = 0; layer < config.keymap.length; layer++) {
      await backend.setKeymap(layer, config.keymap[layer]!);
      await backend.setEncoder(layer, config.encoders[layer]!);
    }
    await backend.setCadSettings(config.settings);
    await backend.commit();
    const snapshot = await backend.sync();
    setOrthoPadSnapshot(snapshot.info, snapshot.config);
    message = 'Saved and verified';
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Failed to save OrthoPad configuration';
    message = '';
    throw reason;
  } finally {
    busy = false;
  }
}

export async function discardOrthoPadChanges(): Promise<void> {
  if (!backend) throw new Error('OrthoPad is not connected');
  busy = true;
  error = '';
  message = 'Discarding changes...';
  try {
    await backend.discard();
    const snapshot = await backend.sync();
    setOrthoPadSnapshot(snapshot.info, snapshot.config);
    message = 'Changes discarded';
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Failed to discard OrthoPad changes';
    throw reason;
  } finally {
    busy = false;
  }
}

export async function resetOrthoPadDefaults(): Promise<void> {
  if (!backend) throw new Error('OrthoPad is not connected');
  busy = true;
  error = '';
  message = 'Resetting device defaults...';
  try {
    await backend.resetDefaults();
    const snapshot = await backend.sync();
    setOrthoPadSnapshot(snapshot.info, snapshot.config);
    message = 'Defaults restored';
  } catch (reason) {
    error = reason instanceof Error ? reason.message : 'Failed to restore defaults';
    throw reason;
  } finally {
    busy = false;
  }
}
