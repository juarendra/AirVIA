import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PacketQueue, type QueueConfig } from './queue';
import { type RawPacket } from '../core/protocol';

const pkt = (...bytes: number[]): RawPacket => bytes;

function makeConfig(overrides: Partial<QueueConfig> = {}): QueueConfig {
  return { retries: 3, timeoutMs: 1000, maxDepth: 10, ...overrides };
}

describe('PacketQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('dequeues first enqueued packet', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    expect(q.inFlight()).toEqual(pkt(1));
  });

  it('returns null when empty', () => {
    const q = new PacketQueue(makeConfig());
    expect(q.inFlight()).toBeNull();
  });

  it('resolve advances to next', () => {
    const q = new PacketQueue(makeConfig());
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));
    const first = q.inFlight();
    expect(first).toEqual(pkt(1));
    q.resolve(pkt(0xFF));
    expect(q.inFlight()).toEqual(pkt(2));
  });

  it('retry on timeout (3 timeouts exhaust and advance)', () => {
    const q = new PacketQueue(makeConfig({ retries: 3 }));
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));

    expect(q.inFlight()).toEqual(pkt(1));

    q.timeout();
    expect(q.inFlight()).toEqual(pkt(1)); // retry 1

    q.timeout();
    expect(q.inFlight()).toEqual(pkt(1)); // retry 2

    q.timeout(); // exhausted
    expect(q.inFlight()).toEqual(pkt(2));
  });

  it('stops after max retries (config retries=1, timeout → advance)', () => {
    const q = new PacketQueue(makeConfig({ retries: 1 }));
    q.enqueue(pkt(1));
    q.enqueue(pkt(2));

    expect(q.inFlight()).toEqual(pkt(1));
    q.timeout();
    expect(q.inFlight()).toEqual(pkt(2));
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
    q.inFlight();
    q.clear();
    expect(q.pendingCount).toBe(0);
    expect(q.inFlight()).toBeNull();
  });
});
