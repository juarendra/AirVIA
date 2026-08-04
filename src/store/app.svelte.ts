import type { V3Definition } from '../core/v3-definition';
import type { TransportState } from '../ble/transport';
import type { RawPacket } from '../core/protocol';
import { keycodeLabel } from '../core/keycodes';
import type { AppDestination } from '../ui/navigation';

let definition = $state<V3Definition | null>(null);
let connectionState = $state<TransportState>('disconnected');
let activeLayer = $state<number>(0);
let activeTab = $state<AppDestination>('keymap');
let keymap = $state<number[]>([]);
let layerCount = $state<number>(0);
let encoderCount = $state<number>(0);
let encoderMap = $state<number[] | null>(null);
let macroCount = $state<number | null>(null);
let macroBytes = $state<number | null>(null);
let macroBuffer = $state<number[] | null>(null);
let layoutOptions = $state<number | null>(null);

let brightness = $state<number | null>(null);
let effect = $state<number | null>(null);
let speed = $state<number | null>(null);
let hue = $state<number | null>(null);
let saturation = $state<number | null>(null);

export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'failed';

export type SyncPhase =
  | 'disconnected'
  | 'connecting'
  | 'syncing'
  | 'ready'
  | 'error'
  | 'stale';

let syncPhase = $state<SyncPhase>('disconnected');
let syncProgress = $state('');
let deviceName = $state('');
let protocolVersion = $state(0);
let firmwareVersion = $state(0);

export type SelectedTarget =
  | { type: 'key'; layer: number; row: number; col: number }
  | { type: 'encoder'; layer: number; id: number; cw: boolean };

let selectedTarget = $state<SelectedTarget | null>(null);

let packetLog = $state<Array<{ dir: 'tx' | 'rx'; packet: RawPacket }>>([]);

export function getDefinition(): V3Definition | null { return definition; }
export function setDefinition(def: V3Definition | null) { definition = def; }

let saveState = $state<SaveState>('clean');
let pendingChanges = $state(0);
let editDuringSave = $state(0);

export function getSaveState(): SaveState { return saveState; }
export function getPendingChanges(): number { return pendingChanges; }
export function markDirty() {
  if (saveState === 'saving') {
    editDuringSave++;
  } else {
    saveState = 'dirty';
  }
  pendingChanges++;
}
export function markSaving() { saveState = 'saving'; editDuringSave = 0; }
export function markSaved() {
  if (editDuringSave > 0) {
    saveState = 'dirty';
    pendingChanges = editDuringSave;
    editDuringSave = 0;
  } else {
    saveState = 'saved';
    pendingChanges = 0;
    setTimeout(() => { if (saveState === 'saved') saveState = 'clean'; }, 3000);
  }
}
export function markSaveFailed() { saveState = 'failed'; }

export function resetDeviceState() {
  setConnectionState('disconnected');
  setSyncPhase('disconnected');
  setSyncProgress('');
  setDeviceName('');
  setProtocolVersion(0);
  setFirmwareVersion(0);
  setLayerCount(0);
  setEncoderCount(0);
  setEncoderMap(null);
  setMacroCount(null);
  setMacroBytes(null);
  setLayoutOptions(null);
  setLighting(null);
  // ponytail: leave layout/definition, clear mapped device values
  saveState = 'clean';
  pendingChanges = 0;
  editDuringSave = 0;
}

export function getConnectionState(): TransportState { return connectionState; }
export function setConnectionState(s: TransportState) { connectionState = s; }

export function getActiveLayer(): number { return activeLayer; }
export function setActiveLayer(n: number) { activeLayer = n; }

export function getActiveTab(): AppDestination { return activeTab; }
export function setActiveTab(t: AppDestination) { activeTab = t; }

export function getKeymap(): number[] { return keymap; }
export function setKeymap(km: number[]) { keymap = km; }

export function getLayerCount(): number { return layerCount; }
export function setLayerCount(n: number) { layerCount = n; }

export function getEncoderCount(): number { return encoderCount; }
export function setEncoderCount(n: number) { encoderCount = n; }

export function getEncoderMap(): number[] | null { return encoderMap; }
export function setEncoderMap(em: number[] | null) { encoderMap = em; }

export function getMacroCount(): number | null { return macroCount; }
export function setMacroCount(n: number | null) { macroCount = n; }

export function getMacroBytes(): number | null { return macroBytes; }
export function setMacroBytes(n: number | null) { macroBytes = n; }

export function getMacroBuffer(): number[] | null { return macroBuffer; }
export function setMacroBuffer(buf: number[] | null) { macroBuffer = buf; }

export function getLayoutOptions(): number | null { return layoutOptions; }
export function setLayoutOptions(opts: number | null) { layoutOptions = opts; }

export function getLighting(): { brightness: number; effect: number; speed: number; hue: number; saturation: number } | null {
  if (brightness === null) return null;
  return { brightness, effect: effect!, speed: speed!, hue: hue!, saturation: saturation! };
}
export function setLighting(val: { brightness: number; effect: number; speed: number; hue: number; saturation: number } | null) {
  if (val === null) {
    brightness = null; effect = null; speed = null; hue = null; saturation = null;
  } else {
    brightness = val.brightness; effect = val.effect; speed = val.speed; hue = val.hue; saturation = val.saturation;
  }
}
export function setLightingBrightness(v: number) { brightness = v; }
export function setLightingEffect(v: number) { effect = v; }
export function setLightingSpeed(v: number) { speed = v; }
export function setLightingHue(v: number) { hue = v; }
export function setLightingSaturation(v: number) { saturation = v; }

export function getSyncPhase(): SyncPhase { return syncPhase; }
export function setSyncPhase(p: SyncPhase) { syncPhase = p; }
export function markStale() { syncPhase = 'stale'; }
export function getSyncProgress(): string { return syncProgress; }
export function getDeviceName(): string { return deviceName; }
export function getProtocolVersion(): number { return protocolVersion; }
export function getFirmwareVersion(): number { return firmwareVersion; }

export function setSyncProgress(s: string) { syncProgress = s; }
export function setDeviceName(n: string) { deviceName = n; }
export function setProtocolVersion(v: number) { protocolVersion = v; }
export function setFirmwareVersion(v: number) { firmwareVersion = v; }

export function getSelectedTarget(): SelectedTarget | null { return selectedTarget; }
export function setSelectedTarget(target: SelectedTarget | null) { selectedTarget = target; }

export function getPacketLog(): Array<{ dir: 'tx' | 'rx'; packet: RawPacket }> { return packetLog; }
export function addPacketLog(dir: 'tx' | 'rx', pkt: RawPacket) {
  packetLog = [...packetLog, { dir, packet: [...pkt] }].slice(-100);
}

export function getKeycodeLabel(code: number): string {
  return keycodeLabel(code);
}

export function keycodeAt(layer: number, row: number, col: number): number {
  const rows = definition?.matrix.rows ?? 0;
  const cols = definition?.matrix.cols ?? 0;
  return keymap[layer * rows * cols + row * cols + col] ?? 0;
}

export function setKeymapAtIndex(index: number, value: number): void {
  keymap[index] = value;
}

export function setKeycodeAt(layer: number, row: number, col: number, code: number): void {
  const rows = definition?.matrix.rows ?? 0;
  const cols = definition?.matrix.cols ?? 0;
  keymap[layer * rows * cols + row * cols + col] = code;
}

export function getEncoderKeycode(layer: number, enc: number, cw: boolean): number {
  return encoderMap?.[layer * encoderCount * 2 + enc * 2 + (cw ? 1 : 0)] ?? 0;
}

export function setEncoderKeycode(layer: number, enc: number, cw: boolean, code: number): void {
  if (encoderMap) {
    encoderMap[layer * encoderCount * 2 + enc * 2 + (cw ? 1 : 0)] = code;
  }
}
