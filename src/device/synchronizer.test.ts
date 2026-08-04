import { describe, it, expect, vi, beforeEach } from 'vitest';
import { synchronizeDevice } from './synchronizer';
import { sendViaCommand } from '../ble/dispatch';

vi.mock('../ble/dispatch');
vi.mock('../store/app.svelte', () => ({
  setSyncPhase: vi.fn(),
  setSyncProgress: vi.fn(),
  getDefinition: () => ({ matrix: { rows: 2, cols: 2 }, encoders: 0 }),
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
});
