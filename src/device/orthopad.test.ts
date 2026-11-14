import { describe, expect, it } from 'vitest';
import { defaultOrthoPadConfig, OrthoPadBackend } from './orthopad';
import { OrthoPadCommand } from '../core/orthopad-protocol';

class FakeTransport {
  async request(command: number, payload = new Uint8Array()): Promise<Uint8Array> {
    if (command === OrthoPadCommand.GetInfo) {
      const encode = (value: string) => new Uint8Array([value.length, ...new TextEncoder().encode(value)]);
      return new Uint8Array([
        ...encode('OrthoPad'),
        ...encode('0.3.0'),
        1, 0, 1, 0, 3, 5, 1,
        0x1f, 0, 0, 0,
      ]);
    }
    if (command === OrthoPadCommand.GetKeymap) return new Uint8Array([5, 1, 0x29, 0, 0, 1, 0x16, 0, 0, 1, 0x10, 0, 0, 1, 8, 0, 0, 1, 0x14, 0, 0]);
    if (command === OrthoPadCommand.GetEncoder) return new Uint8Array([2, 1, 0, 0, 2, 0xff, 0xff, 0]);
    if (command === OrthoPadCommand.GetCadSettings) return new Uint8Array(23);
    if (command === OrthoPadCommand.GetJoystickState) return new Uint8Array([0, 2, 224, 1, 0x20, 0x04, 1, 0, 0xfe, 0xff, 0xff, 0xff]);
    return payload;
  }
}

class LegacyJoystickTransport {
  async request(command: number): Promise<Uint8Array> {
    if (command === OrthoPadCommand.GetJoystickState) {
      return new Uint8Array([0, 2, 224, 1, 0x20, 0x00, 0x00, 0x00]);
    }
    return new Uint8Array();
  }
}

describe('OrthoPad configuration', () => {
  it('creates the expected three-layer default config', () => {
    const config = defaultOrthoPadConfig();
    expect(config.keymap).toHaveLength(3);
    expect(config.keymap.every(layer => layer.length === 5)).toBe(true);
    expect(config.encoders).toHaveLength(1);
    expect(config.settings.deadzone).toBe(100);
  });

  it('syncs info, keymap, encoder, and settings', async () => {
    const backend = new OrthoPadBackend(new FakeTransport());
    const snapshot = await backend.sync();
    expect(snapshot.info.deviceName).toBe('OrthoPad');
    expect(snapshot.config.keymap).toHaveLength(3);
    expect(snapshot.config.encoders).toHaveLength(3);
    expect(snapshot.config.settings.centerX).toBe(0);
  });

  it('decodes live joystick telemetry', async () => {
    const state = await new OrthoPadBackend(new FakeTransport()).getJoystickState();
    expect(state).toEqual({
      rawX: 512,
      rawY: 480,
      buttonMask: 0x20,
      modeFlags: 0x04,
      activeLayer: 1,
      encoderSteps: -2,
    });
  });

  it('decodes legacy eight-byte joystick telemetry without encoder steps', async () => {
    const state = await new OrthoPadBackend(new LegacyJoystickTransport()).getJoystickState();
    expect(state.encoderSteps).toBeNull();
    expect(state.rawX).toBe(512);
    expect(state.rawY).toBe(480);
  });
});
