export class SimulatorTransport {
  async sendPacket(data: number[]): Promise<number[]> {
    if (data[0] === 0x01 && data[1] === 0x01) {
      return [0x01, 0x00, 0x0C]; // Protocol V12
    }
    return [0xFF]; // Error
  }
}
