import { describe, it, expect } from 'vitest';
import { SimulatorTransport } from './simulator';

describe('SimulatorTransport', () => {
  it('responds to get_protocol_version', async () => {
    const sim = new SimulatorTransport();
    const resp = await sim.sendPacket([0x01, 0x01]);
    expect(resp[0]).toBe(0x01);
    expect(resp[1]).toBe(0x00);
    expect(resp[2]).toBe(0x0C);
  });
});
