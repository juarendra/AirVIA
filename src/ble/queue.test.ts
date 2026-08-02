import { describe, it, expect } from 'vitest';
import { PacketQueue, type QueueConfig } from './queue';
import { type RawPacket } from '../core/protocol';

const pkt = (...bytes: number[]): RawPacket => bytes;

function makeConfig(overrides: Partial<QueueConfig> = {}): QueueConfig {
  return { retries: 3, maxDepth: 10, ...overrides };
}

describe('PacketQueue', () => {
  it('dequeues first enqueued packet', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    expect(q.takeForSend()).toEqual(pkt(1));
  });

  it('returns null when empty', () => {
    const q = new PacketQueue(makeConfig());
    expect(q.takeForSend()).toBeNull();
  });

  it('resolve advances to next', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    expect(q.takeForSend()).toEqual(pkt(1));
    q.resolve();
    expect(q.takeForSend()).toEqual(pkt(2));
  });

  it('retry on timeout (3 timeouts exhaust and advance)', () => {
    const q = new PacketQueue(makeConfig({ retries: 3 }));
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));

    expect(q.takeForSend()).toEqual(pkt(1));

    q.retry();
    expect(q.takeForSend()).toEqual(pkt(1)); // retry 1

    q.retry();
    expect(q.takeForSend()).toEqual(pkt(1)); // retry 2

    q.retry(); // exhausted
    expect(q.takeForSend()).toEqual(pkt(2));
  });

  it('stops after max retries (config retries=1, retry → advance)', () => {
    const q = new PacketQueue(makeConfig({ retries: 1 }));
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));

    expect(q.takeForSend()).toEqual(pkt(1));
    q.retry();
    expect(q.takeForSend()).toEqual(pkt(2));
  });

  it('rejects enqueue when full', () => {
    const q = new PacketQueue(makeConfig({ maxDepth: 2 }));
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    expect(() => q.enqueue(pkt(3))).toThrow('Queue full');
  });

  it('clear empties queue', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    q.takeForSend();
    q.clear();
    expect(q.pendingCount).toBe(0);
    expect(q.hasInFlight()).toBe(false);
  });
});
