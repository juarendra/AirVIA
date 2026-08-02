import type { V3Definition } from '../core/v3-definition';
import type { TransportState } from '../ble/transport';
import type { RawPacket } from '../core/protocol';
import { keycodeLabel } from '../core/keycodes';

let definition = $state<V3Definition | null>(null);
let connectionState = $state<TransportState>('disconnected');
let activeLayer = $state<number>(0);
let activeTab = $state<string>('keymap');
let keymap = $state<number[]>([]);
let layerCount = $state<number>(0);
let encoderCount = $state<number>(0);
let encoderMap = $state<number[]>([]);
let macroCount = $state<number>(0);
let macroBytes = $state<number>(0);
let macroBuffer = $state<number[]>([]);
let layoutOptions = $state<number>(0);

let brightness = $state<number>(128);
let effect = $state<number>(0);
let speed = $state<number>(3);
let hue = $state<number>(0);
let saturation = $state<number>(255);

export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'failed';

export type SyncPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'ready'
  | 'error';

let syncPhase = $state<SyncPhase>('idle');
let syncProgress = $state('');
let deviceName = $state('');
let protocolVersion = $state(0);
let firmwareVersion = $state(0);

let selectedCell = $state<{ layer: number; row: number; col: number } | null>(null);

let packetLog = $state<Array<{ dir: 'tx' | 'rx'; packet: RawPacket }>>([]);

export function getDefinition(): V3Definition | null { return definition; }
export function setDefinition(def: V3Definition | null) { definition = def; }

let saveState = $state<SaveState>('clean');
let pendingChanges = $state(0);

export function getSaveState(): SaveState { return saveState; }
export function getPendingChanges(): number { return pendingChanges; }
export function markDirty() {
  if (saveState !== 'saving') saveState = 'dirty';
  pendingChanges++;
}
export function markSaving() { saveState = 'saving'; }
export function markSaved() { saveState = 'saved'; pendingChanges = 0; setTimeout(() => { if (saveState === 'saved') saveState = 'clean'; }, 3000); }
export function markSaveFailed() { saveState = 'failed'; }

export function getConnectionState(): TransportState { return connectionState; }
export function setConnectionState(s: TransportState) { connectionState = s; }

export function getActiveLayer(): number { return activeLayer; }
export function setActiveLayer(n: number) { activeLayer = n; }

export function getActiveTab(): string { return activeTab; }
export function setActiveTab(t: string) { activeTab = t; }

export function getKeymap(): number[] { return keymap; }
export function setKeymap(km: number[]) { keymap = km; }

export function getLayerCount(): number { return layerCount; }
export function setLayerCount(n: number) { layerCount = n; }

export function getEncoderCount(): number { return encoderCount; }
export function setEncoderCount(n: number) { encoderCount = n; }

export function getEncoderMap(): number[] { return encoderMap; }
export function setEncoderMap(em: number[]) { encoderMap = em; }

export function getMacroCount(): number { return macroCount; }
export function setMacroCount(n: number) { macroCount = n; }

export function getMacroBytes(): number { return macroBytes; }
export function setMacroBytes(n: number) { macroBytes = n; }

export function getMacroBuffer(): number[] { return macroBuffer; }
export function setMacroBuffer(buf: number[]) { macroBuffer = buf; }

export function getLayoutOptions(): number { return layoutOptions; }
export function setLayoutOptions(opts: number) { layoutOptions = opts; }

export function getLighting(): { brightness: number; effect: number; speed: number; hue: number; saturation: number } {
  return { brightness, effect, speed, hue, saturation };
}
export function setLightingBrightness(v: number) { brightness = v; }
export function setLightingEffect(v: number) { effect = v; }
export function setLightingSpeed(v: number) { speed = v; }
export function setLightingHue(v: number) { hue = v; }
export function setLightingSaturation(v: number) { saturation = v; }

export function getSyncPhase(): SyncPhase { return syncPhase; }
export function getSyncProgress(): string { return syncProgress; }
export function getDeviceName(): string { return deviceName; }
export function getProtocolVersion(): number { return protocolVersion; }
export function getFirmwareVersion(): number { return firmwareVersion; }

export function setSyncPhase(p: SyncPhase) { syncPhase = p; }
export function setSyncProgress(s: string) { syncProgress = s; }
export function setDeviceName(n: string) { deviceName = n; }
export function setProtocolVersion(v: number) { protocolVersion = v; }
export function setFirmwareVersion(v: number) { firmwareVersion = v; }

export function getSelectedCell(): { layer: number; row: number; col: number } | null { return selectedCell; }
export function setSelectedCell(cell: { layer: number; row: number; col: number } | null) { selectedCell = cell; }

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
  return encoderMap[layer * encoderCount * 2 + enc * 2 + (cw ? 1 : 0)] ?? 0;
}

export function setEncoderKeycode(layer: number, enc: number, cw: boolean, code: number): void {
  encoderMap[layer * encoderCount * 2 + enc * 2 + (cw ? 1 : 0)] = code;
}
