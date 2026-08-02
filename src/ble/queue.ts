import { type RawPacket } from '../core/protocol';

export type QueueConfig = { retries: number; timeoutMs: number; maxDepth: number };

export class PacketQueue {
  private pending: RawPacket[] = [];
  private current: RawPacket | null = null;
  private retriesLeft: number = 0;
  private config: QueueConfig;

  constructor(config: QueueConfig) {
    this.config = config;
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  enqueue(packet: RawPacket): void {
    if (this.pending.length >= this.config.maxDepth) {
      throw new Error('Queue full');
    }
    this.pending.push(packet);
  }

  inFlight(): RawPacket | null {
    if (this.current) return this.current;
    const next = this.pending.shift();
    if (!next) return null;
    this.current = next;
    this.retriesLeft = this.config.retries;
    return this.current;
  }

  resolve(_response: RawPacket): void {
    this.current = null;
  }

  timeout(): void {
    if (!this.current) return;
    this.retriesLeft--;
    if (this.retriesLeft < 0) {
      this.current = null;
    }
  }

  clear(): void {
    this.pending = [];
    this.current = null;
    this.retriesLeft = 0;
  }
}
