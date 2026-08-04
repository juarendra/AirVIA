import { describe, it, expect, vi, beforeEach } from 'vitest';
import { synchronizeDevice } from './synchronizer';
import { sendViaCommand } from '../ble/dispatch';

vi.mock('../ble/dispatch');
vi.mock('../store/app.svelte', () => ({
  setSyncPhase: vi.fn(),
  setSyncProgress: vi.fn(),
  getDefinition: () => ({ matrix: { rows: 2, cols: 2 }, encoders: 1, lighting: 'qmk_backlight' }),
  setLayerCount: vi.fn(),
  setKeymap: vi.fn(),
  setKeymapAtIndex: vi.fn(),
  setEncoderCount: vi.fn(),
  setEncoderMap: vi.fn(),
  setMacroCount: vi.fn(),
  setMacroBytes: vi.fn(),
}));

describe('synchronizeDevice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects short keymap chunk response', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer -> 1*2*2*2 = 8 bytes keymap
    
    // Length is 7, we expect 4 + 8 = 12
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x12, 0x00, 0x00, 0x08, 0x00, 0x01, 0x00]); 
    await expect(synchronizeDevice()).rejects.toThrow('Invalid chunk response');
  });

  it('fails if chunk offset is out of bounds', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer -> 1*2*2*2 = 8 bytes keymap
    // Send a response where offset doesn't match the expected offset.
    // The expected offset is 0, let's send 1.
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x12, 0x00, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    await expect(synchronizeDevice()).rejects.toThrow('Invalid chunk response');
  });

  it('fails if chunk is too long for remaining space', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 8 bytes keymap
    vi.mocked(sendViaCommand).mockResolvedValueOnce([
      0x12, 0x00, 0x00, 0x0A, // size 10 (0x0A), but only 8 expected total
      0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07
    ]);
    await expect(synchronizeDevice()).rejects.toThrow('Invalid chunk response');
  });

  it('reads encoders if supported', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer
    vi.mocked(sendViaCommand).mockResolvedValueOnce([
      0x12, 0x00, 0x00, 0x08,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]); // 1*2*2*2 = 8 bytes keymap chunk
    // Encoder test
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x14, 0, 0, 0, 0, 0]);
    // Encoder read layer 0, encoder 0, cw 0
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x14, 0, 0, 0, 0x00, 0x01]);
    // Encoder read layer 0, encoder 0, cw 1
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x14, 0, 0, 1, 0x00, 0x02]);
    // Macros
    vi.mocked(sendViaCommand).mockRejectedValue(new Error('no macro'));
    const snapshot = await synchronizeDevice();
    expect(snapshot.encoders).toEqual([1, 2]);
  });

  it('reads lighting if supported', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer
    vi.mocked(sendViaCommand).mockResolvedValueOnce([
      0x12, 0x00, 0x00, 0x08,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]); // 1*2*2*2 = 8 bytes keymap chunk
    
    vi.mocked(sendViaCommand).mockRejectedValueOnce(new Error('no encoder'));

    // Lighting tests
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x08, 0x08, 0x01, 0, 100]); // brightness
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x08, 0x08, 0x02, 0, 1]); // effect
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x08, 0x08, 0x03, 0, 2]); // speed
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x08, 0x08, 0x04, 0, 3]); // hue
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x08, 0x08, 0x05, 0, 4]); // saturation

    vi.mocked(sendViaCommand).mockRejectedValue(new Error('no macro'));
    const snapshot = await synchronizeDevice();
    expect(snapshot.lighting).toEqual({ brightness: 100, effect: 1, speed: 2, hue: 3, saturation: 4 });
  });

  it('skips lighting if unsupported', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer
    vi.mocked(sendViaCommand).mockResolvedValueOnce([
      0x12, 0x00, 0x00, 0x08,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]); // 1*2*2*2 = 8 bytes keymap chunk
    
    vi.mocked(sendViaCommand).mockRejectedValueOnce(new Error('no encoder'));
    vi.mocked(sendViaCommand).mockRejectedValueOnce(new Error('no lighting'));
    vi.mocked(sendViaCommand).mockRejectedValue(new Error('no macro'));
    const snapshot = await synchronizeDevice();
    expect(snapshot.lighting).toBeUndefined();
  });

  it('skips encoders if unsupported', async () => {
    vi.mocked(sendViaCommand).mockResolvedValueOnce([0x11, 1]); // 1 layer
    vi.mocked(sendViaCommand).mockResolvedValueOnce([
      0x12, 0x00, 0x00, 0x08,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]); // 1*2*2*2 = 8 bytes keymap chunk
    // Encoder test
    vi.mocked(sendViaCommand).mockRejectedValueOnce(new Error('unsupported'));
    // Macros
    vi.mocked(sendViaCommand).mockRejectedValue(new Error('no macro'));
    const snapshot = await synchronizeDevice();
    expect(snapshot.encoders).toBeUndefined();
  });
});
