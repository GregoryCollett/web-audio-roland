import { describe, it, expect, vi } from 'vitest';
import { kick } from '../kick';
import { snare } from '../snare';
import { clap } from '../clap';
import { rimshot } from '../rimshot';
import { closedHat } from '../closedHat';
import { openHat } from '../openHat';
import { lowTom } from '../lowTom';
import { midTom } from '../midTom';
import { hiTom } from '../hiTom';
import { crash } from '../crash';
import { ride } from '../ride';
import type { VoiceTrigger } from '../../types';

// jsdom doesn't have Web Audio API, so we create a minimal mock
function createMockAudioContext() {
  const mockGain = {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockOsc = {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const mockFilter = {
    type: 'lowpass',
    frequency: { value: 350 },
    Q: { value: 1 },
    connect: vi.fn(),
  };

  const mockBufferSource = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    destination: { connect: vi.fn() },
    createOscillator: vi.fn(() => ({ ...mockOsc })),
    createGain: vi.fn(() => ({
      ...mockGain,
      gain: {
        ...mockGain.gain,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
    })),
    createBiquadFilter: vi.fn(() => ({
      ...mockFilter,
      connect: vi.fn(),
    })),
    createBuffer: vi.fn((_channels: number, length: number, _sampleRate: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
  } as unknown as AudioContext;

  return ctx;
}

describe('Voice synthesis functions', () => {
  const voices: [string, VoiceTrigger][] = [
    ['kick', kick],
    ['snare', snare],
    ['clap', clap],
    ['rimshot', rimshot],
    ['closedHat', closedHat],
    ['lowTom', lowTom],
    ['midTom', midTom],
    ['hiTom', hiTom],
    ['crash', crash],
    ['ride', ride],
  ];

  it.each(voices)('%s is a function', (_name, voice) => {
    expect(typeof voice).toBe('function');
  });

  it.each(voices)('%s does not throw when triggered', (_name, voice) => {
    const ctx = createMockAudioContext();
    expect(() => {
      voice(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, false);
    }).not.toThrow();
  });

  it.each(voices)('%s does not throw with accent', (_name, voice) => {
    const ctx = createMockAudioContext();
    expect(() => {
      voice(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5, tune: 0.5 }, true);
    }).not.toThrow();
  });

  it('openHat returns a gain node (for choke support)', () => {
    const ctx = createMockAudioContext();
    const result = openHat(ctx, ctx.destination, 0, { level: 0.8, decay: 0.5 }, false);
    expect(result).toBeDefined();
    expect(result.gain).toBeDefined();
  });
});
