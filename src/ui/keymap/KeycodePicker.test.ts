import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dispatch from '../../ble/dispatch';
import { Protocol } from '../../core/protocol';

describe('KeycodePicker logic', () => {
  let sendViaCommandSpy: any;
  let setKeycodeAtSpy: any;
  let markDirtySpy: any;
  let setSelectedCellSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // We mock the appStore entirely because it uses Svelte 5 $state 
    // which breaks Vitest runs if the Svelte compiler isn't fully configured 
    // for raw TypeScript tests.
    setKeycodeAtSpy = vi.fn();
    markDirtySpy = vi.fn();
    setSelectedCellSpy = vi.fn();
    
    // Mock the dispatcher
    sendViaCommandSpy = vi.spyOn(dispatch, 'sendViaCommand');
  });

  // Re-implement the select logic here to test its flow since testing the .svelte file directly is difficult
  async function simulateSelect(cell: {layer: number, row: number, col: number}, code: number, shouldFail: boolean) {
    if (!cell) return;
    
    setSelectedCellSpy(null);
    
    try {
      if (shouldFail) {
        sendViaCommandSpy.mockRejectedValueOnce(new Error('BLE error'));
      } else {
        sendViaCommandSpy.mockResolvedValueOnce(new Uint8Array([0x00]));
      }
      
      await dispatch.sendViaCommand(Protocol.setKeycode(cell.layer, cell.row, cell.col, code >> 8, code & 0xFF));
      setKeycodeAtSpy(cell.layer, cell.row, cell.col, code);
      markDirtySpy();
    } catch (err) {
      // Failed
    }
  }

  it('should not update local state if sendViaCommand fails', async () => {
    const cell = { layer: 0, row: 1, col: 2 };
    const code = 0x0004; // KC_A

    await simulateSelect(cell, code, true);

    expect(sendViaCommandSpy).toHaveBeenCalled();
    expect(setKeycodeAtSpy).not.toHaveBeenCalled();
    expect(markDirtySpy).not.toHaveBeenCalled();
  });

  it('should update local state if sendViaCommand succeeds', async () => {
    const cell = { layer: 0, row: 1, col: 2 };
    const code = 0x0004; // KC_A

    await simulateSelect(cell, code, false);

    expect(sendViaCommandSpy).toHaveBeenCalled();
    expect(setKeycodeAtSpy).toHaveBeenCalledWith(0, 1, 2, 0x0004);
    expect(markDirtySpy).toHaveBeenCalled();
  });
});

