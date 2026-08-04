import type { RawPacket } from '../core/protocol';
import type { CommandRequest } from '../core/commands';
import type { Transport, TransportState } from './transport';

export class SimulatorTransport implements Transport {
  state: TransportState = 'connected';
  onResponse: ((pkt: RawPacket) => void) | null = null;
  onStateChange: ((s: TransportState) => void) | null = null;

  async sendPacket(data: number[]): Promise<number[]> {
    if (data[0] === 0x01 && data[1] === 0x01) {
      return [0x01, 0x00, 0x0C]; // Protocol V12
    }
    if (data[0] === 0x07) {
      // Lighting configuration
      // Return 0x07 command echoed back with acknowledgment
      const resp = [...data];
      return resp;
    }
    return [0xFF]; // Error
  }

  async writePacket(packet: RawPacket): Promise<void> {
    // Fire onResponse based on sendPacket simulation
    const response = await this.sendPacket(packet);
    if (this.onResponse) {
      this.onResponse(response);
    }
  }

  async connect(): Promise<void> {
    this.state = 'connected';
    this.onStateChange?.(this.state);
  }

  async disconnect(): Promise<void> {
    this.state = 'disconnected';
    this.onStateChange?.(this.state);
  }

  async sendCommand(request: CommandRequest): Promise<RawPacket> {
    const response = await this.sendPacket(request.packet);
    return response;
  }

  async readInfo(): Promise<RawPacket | null> {
    return null;
  }
}
