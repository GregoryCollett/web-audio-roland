import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Clock } from '../clock';

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTick with scheduled time when started', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);

    vi.advanceTimersByTime(30);

    expect(onTick).toHaveBeenCalled();
    const [time, step] = onTick.mock.calls[0];
    expect(typeof time).toBe('number');
    expect(step).toBe(0);
  });

  it('does not call onTick when stopped', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);
    clock.stop();

    vi.advanceTimersByTime(100);

    const callCount = onTick.mock.calls.length;
    vi.advanceTimersByTime(200);
    expect(onTick.mock.calls.length).toBe(callCount);
  });

  it('advances steps 0 through 15 then wraps to 0', () => {
    const onTick = vi.fn();
    let currentTime = 0;
    const mockCtx = {
      get currentTime() { return currentTime; },
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 120);

    const steps: number[] = [];
    for (let i = 0; i < 17; i++) {
      vi.advanceTimersByTime(130);
      currentTime += 0.13;
    }

    for (const call of onTick.mock.calls) {
      steps.push(call[1]);
    }

    expect(steps.length).toBeGreaterThanOrEqual(17);
    expect(steps[0]).toBe(0);
    expect(steps[15]).toBe(15);
    expect(steps[16]).toBe(0);
  });

  it('respects BPM for timing', () => {
    const onTick = vi.fn();
    const mockCtx = {
      currentTime: 0,
    } as unknown as AudioContext;

    const clock = new Clock(onTick);
    clock.start(mockCtx, 60);

    expect(clock.getStepDuration()).toBeCloseTo(0.25);
  });
});
