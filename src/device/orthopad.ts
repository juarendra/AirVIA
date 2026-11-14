import {
  OrthoPadCommand,
  OrthoPadProtocolError,
  type OrthoPadStatus,
} from '../core/orthopad-protocol';

export interface OrthoPadTransport {
  request(command: number, payload?: Uint8Array, timeoutMs?: number): Promise<Uint8Array>;
}

export const ORTHOPAD_LAYER_COUNT = 3;
export const ORTHOPAD_BUTTON_COUNT = 5;
export const ORTHOPAD_ENCODER_COUNT = 1;

export type OrthoPadAction = {
  type: 'none' | 'key';
  keycode: number;
  modifiers: number;
};

export type OrthoPadEncoderAction = OrthoPadAction | { type: 'wheel'; amount: number; keycode: 0; modifiers: 0 };

export type OrthoPadEncoderLayer = {
  clockwise: OrthoPadEncoderAction;
  counterClockwise: OrthoPadEncoderAction;
};

export type OrthoPadCadSettings = {
  centerX: number;
  centerY: number;
  deadzone: number;
  speedMilli: number;
  curveMilli: number;
  invertX: boolean;
  invertY: boolean;
  tapMs: number;
  holdMs: number;
  encoderTapMs: number;
  layerHoldMs: number;
  encoderDirection: -1 | 1;
  wheelStep: number;
  panModifier: number;
};

export type OrthoPadConfig = {
  keymap: OrthoPadAction[][];
  encoders: OrthoPadEncoderLayer[];
  settings: OrthoPadCadSettings;
};

export type OrthoPadInfo = {
  deviceName: string;
  firmwareVersion: string;
  protocolMajor: number;
  protocolMinor: number;
  configSchema: number;
  layers: number;
  buttons: number;
  encoders: number;
  capabilities: number;
};

export type OrthoPadJoystickState = {
  rawX: number;
  rawY: number;
  buttonMask: number;
  modeFlags: number;
  activeLayer: number;
  encoderSteps: number | null;
};

const ACTION_NONE = 0;
const ACTION_KEY = 1;
const ACTION_WHEEL = 2;

export function defaultOrthoPadConfig(): OrthoPadConfig {
  const key = (keycode: number, modifiers = 0): OrthoPadAction => ({ type: 'key', keycode, modifiers });
  const none = (): OrthoPadAction => ({ type: 'none', keycode: 0, modifiers: 0 });
  return {
    keymap: [
      [key(0x29), key(0x16), key(0x10), key(0x08), key(0x14)],
      [key(0x29), key(0x0f), key(0x06), key(0x15), key(0x07)],
      [key(0x29), key(0x09), key(0x0b), key(0x12), key(0x13)],
    ],
    encoders: [{ clockwise: { type: 'wheel', amount: 1, keycode: 0, modifiers: 0 }, counterClockwise: { type: 'wheel', amount: -1, keycode: 0, modifiers: 0 } }],
    settings: {
      centerX: 512,
      centerY: 512,
      deadzone: 30,
      speedMilli: 50,
      curveMilli: 500,
      invertX: false,
      invertY: false,
      tapMs: 350,
      holdMs: 700,
      encoderTapMs: 450,
      layerHoldMs: 700,
      encoderDirection: 1,
      wheelStep: 1,
      panModifier: 0x02,
    },
  };
}

function textEncode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function textDecode(bytes: Uint8Array, offset: number): { value: string; next: number } {
  const length = bytes[offset] ?? 0;
  const end = offset + 1 + length;
  if (end > bytes.byteLength) throw new OrthoPadProtocolError('Invalid text field');
  return { value: new TextDecoder().decode(bytes.slice(offset + 1, end)), next: end };
}

function encodeAction(action: OrthoPadAction | OrthoPadEncoderAction): Uint8Array {
  const data = new Uint8Array(4);
  const view = new DataView(data.buffer);
  data[0] = action.type === 'none' ? ACTION_NONE : action.type === 'key' ? ACTION_KEY : ACTION_WHEEL;
  if (action.type === 'wheel') view.setInt16(1, action.amount, true);
  else view.setUint16(1, action.keycode, true);
  data[3] = action.modifiers;
  return data;
}

function decodeAction(data: Uint8Array, offset: number): OrthoPadEncoderAction {
  if (offset + 4 > data.byteLength) throw new OrthoPadProtocolError('Invalid action payload');
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  const type = data[offset];
  if (type === ACTION_NONE) return { type: 'none', keycode: 0, modifiers: 0 };
  if (type === ACTION_KEY) return { type: 'key', keycode: view.getUint16(1, true), modifiers: data[offset + 3] ?? 0 };
  if (type === ACTION_WHEEL) return { type: 'wheel', amount: view.getInt16(1, true), keycode: 0, modifiers: 0 };
  throw new OrthoPadProtocolError('Unknown action type');
}

function encodeKeymap(actions: OrthoPadAction[]): Uint8Array {
  const output = new Uint8Array(1 + actions.length * 4);
  output[0] = actions.length;
  actions.forEach((action, index) => output.set(encodeAction(action), 1 + index * 4));
  return output;
}

function decodeKeymap(data: Uint8Array): OrthoPadAction[] {
  const count = data[0] ?? 0;
  if (count !== ORTHOPAD_BUTTON_COUNT || data.byteLength !== 1 + count * 4) throw new OrthoPadProtocolError('Invalid keymap payload');
  return Array.from({ length: count }, (_, index) => {
    const action = decodeAction(data, 1 + index * 4);
    if (action.type === 'wheel') throw new OrthoPadProtocolError('Wheel action is not valid in keymap');
    return action;
  });
}

function encodeEncoder(layer: OrthoPadEncoderLayer): Uint8Array {
  const output = new Uint8Array(8);
  output.set(encodeAction(layer.clockwise), 0);
  output.set(encodeAction(layer.counterClockwise), 4);
  return output;
}

function decodeEncoder(data: Uint8Array): OrthoPadEncoderLayer {
  if (data.byteLength !== 8) throw new OrthoPadProtocolError('Invalid encoder payload');
  return { clockwise: decodeAction(data, 0), counterClockwise: decodeAction(data, 4) };
}

function encodeSettings(settings: OrthoPadCadSettings): Uint8Array {
  const data = new Uint8Array(23);
  const view = new DataView(data.buffer);
  view.setUint16(0, settings.centerX, true);
  view.setUint16(2, settings.centerY, true);
  view.setUint16(4, settings.deadzone, true);
  view.setUint16(6, settings.speedMilli, true);
  view.setUint16(8, settings.curveMilli, true);
  data[10] = (settings.invertX ? 1 : 0) | (settings.invertY ? 2 : 0);
  view.setUint16(11, settings.tapMs, true);
  view.setUint16(13, settings.holdMs, true);
  view.setUint16(15, settings.encoderTapMs, true);
  view.setUint16(17, settings.layerHoldMs, true);
  data[19] = settings.encoderDirection === 1 ? 1 : 0xff;
  data[20] = settings.wheelStep & 0xff;
  data[21] = settings.panModifier;
  data[22] = 0;
  return data;
}

function decodeSettings(data: Uint8Array): OrthoPadCadSettings {
  if (data.byteLength !== 23) throw new OrthoPadProtocolError('Invalid CAD settings payload');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    centerX: view.getUint16(0, true),
    centerY: view.getUint16(2, true),
    deadzone: view.getUint16(4, true),
    speedMilli: view.getUint16(6, true),
    curveMilli: view.getUint16(8, true),
    invertX: (data[10]! & 1) !== 0,
    invertY: (data[10]! & 2) !== 0,
    tapMs: view.getUint16(11, true),
    holdMs: view.getUint16(13, true),
    encoderTapMs: view.getUint16(15, true),
    layerHoldMs: view.getUint16(17, true),
    encoderDirection: data[19] === 0xff ? -1 : 1,
    wheelStep: data[20] ?? 1,
    panModifier: data[21] ?? 0x02,
  };
}

export class OrthoPadBackend {
  constructor(private readonly transport: OrthoPadTransport) {}

  async getInfo(): Promise<OrthoPadInfo> {
    const data = await this.transport.request(OrthoPadCommand.GetInfo);
    let offset = 0;
    const device = textDecode(data, offset); offset = device.next;
    const firmware = textDecode(data, offset); offset = firmware.next;
    if (offset + 11 > data.byteLength) throw new OrthoPadProtocolError('Invalid device info payload');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return {
      deviceName: device.value,
      firmwareVersion: firmware.value,
      protocolMajor: data[offset] ?? 0,
      protocolMinor: data[offset + 1] ?? 0,
      configSchema: view.getUint16(offset + 2, true),
      layers: data[offset + 4] ?? 0,
      buttons: data[offset + 5] ?? 0,
      encoders: data[offset + 6] ?? 0,
      capabilities: view.getUint32(offset + 7, true),
    };
  }

  async getKeymap(layer: number): Promise<OrthoPadAction[]> {
    return decodeKeymap(await this.transport.request(OrthoPadCommand.GetKeymap, Uint8Array.of(layer)));
  }

  async setKeymap(layer: number, actions: OrthoPadAction[]): Promise<void> {
    const body = encodeKeymap(actions);
    const payload = new Uint8Array(1 + body.byteLength);
    payload[0] = layer;
    payload.set(body, 1);
    await this.transport.request(OrthoPadCommand.SetKeymap, payload);
  }

  async getEncoder(layer: number): Promise<OrthoPadEncoderLayer> {
    return decodeEncoder(await this.transport.request(OrthoPadCommand.GetEncoder, Uint8Array.of(layer)));
  }

  async setEncoder(layer: number, encoder: OrthoPadEncoderLayer): Promise<void> {
    const payload = new Uint8Array(1 + 8);
    payload[0] = layer;
    payload.set(encodeEncoder(encoder), 1);
    await this.transport.request(OrthoPadCommand.SetEncoder, payload);
  }

  async getCadSettings(): Promise<OrthoPadCadSettings> {
    return decodeSettings(await this.transport.request(OrthoPadCommand.GetCadSettings));
  }

  async getJoystickState(): Promise<OrthoPadJoystickState> {
    const data = await this.transport.request(OrthoPadCommand.GetJoystickState);
    if (data.byteLength !== 8 && data.byteLength !== 12) throw new OrthoPadProtocolError('Invalid joystick state payload');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return {
      rawX: view.getUint16(0, true),
      rawY: view.getUint16(2, true),
      buttonMask: data[4] ?? 0,
      modeFlags: data[5] ?? 0,
      activeLayer: data[6] ?? 0,
      encoderSteps: data.byteLength === 12 ? view.getInt32(8, true) : null,
    };
  }

  async setTestMode(enabled: boolean): Promise<void> {
    await this.transport.request(OrthoPadCommand.SetTestMode, Uint8Array.of(enabled ? 1 : 0));
  }

  async setCadSettings(settings: OrthoPadCadSettings): Promise<void> {
    await this.transport.request(OrthoPadCommand.SetCadSettings, encodeSettings(settings));
  }

  async commit(): Promise<void> {
    await this.transport.request(OrthoPadCommand.Commit);
  }

  async discard(): Promise<void> {
    await this.transport.request(OrthoPadCommand.Discard);
  }

  async resetDefaults(): Promise<void> {
    await this.transport.request(OrthoPadCommand.ResetDefaults, Uint8Array.of(0x4f, 0x50));
  }

  async sync(): Promise<{ info: OrthoPadInfo; config: OrthoPadConfig }> {
    const info = await this.getInfo();
    if (info.layers !== ORTHOPAD_LAYER_COUNT || info.buttons !== ORTHOPAD_BUTTON_COUNT || info.encoders !== ORTHOPAD_ENCODER_COUNT) {
      throw new Error(`Unsupported OrthoPad layout: ${info.layers} layers, ${info.buttons} buttons, ${info.encoders} encoders`);
    }
    const keymap = await Promise.all(Array.from({ length: info.layers }, (_, layer) => this.getKeymap(layer)));
    const encoders = await Promise.all(Array.from({ length: info.layers }, (_, layer) => this.getEncoder(layer)));
    const settings = await this.getCadSettings();
    return { info, config: { keymap, encoders, settings } };
  }
}

export function actionLabel(action: OrthoPadAction | OrthoPadEncoderAction): string {
  if (action.type === 'none') return 'None';
  if (action.type === 'wheel') return action.amount > 0 ? `Wheel +${action.amount}` : `Wheel ${action.amount}`;
  return `Key 0x${action.keycode.toString(16).padStart(4, '0')}`;
}

export type OrthoPadStatusCode = OrthoPadStatus;
