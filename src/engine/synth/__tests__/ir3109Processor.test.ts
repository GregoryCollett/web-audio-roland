import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.stubGlobal('sampleRate', 44100);
vi.stubGlobal('AudioWorkletProcessor', class {});
vi.stubGlobal('registerProcessor', vi.fn());

const SAMPLE_RATE = 44100;

// Dynamically import after stubbing globals
const { IR3109Filter } = await import('../ir3109Processor');

function makeSine(freq: number, numSamples: number): number[] {
  return Array.from({ length: numSamples }, (_, i) =>
    Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
  );
}

function measurePeak(filter: InstanceType<typeof IR3109Filter>, signal: number[], settleMs = 500): number {
  const settleSamples = Math.floor(SAMPLE_RATE * settleMs / 1000);
  for (let i = 0; i < settleSamples; i++) {
    filter.process(signal[i % signal.length]);
  }
  let peak = 0;
  for (const s of signal) {
    const out = Math.abs(filter.process(s));
    if (out > peak) peak = out;
  }
  return peak;
}

describe('IR3109Filter', () => {
  it('passes signal at max cutoff (output > 0.8 after settling)', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(20000);
    filter.setResonance(0);

    const dc = Array(2000).fill(1.0);
    // Settle
    for (let i = 0; i < 1000; i++) filter.process(1.0);
    const output = dc.map(() => filter.process(1.0));
    const last = output[output.length - 1];
    expect(last).toBeGreaterThan(0.8);
  });

  it('attenuates 1kHz sine at 100Hz cutoff (peak < 0.1)', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(100);
    filter.setResonance(0);

    const sine = makeSine(1000, SAMPLE_RATE);
    const peak = measurePeak(filter, sine);
    expect(peak).toBeLessThan(0.1);
  });

  it('high resonance creates peak near cutoff (louder than no resonance)', () => {
    const measureAt = (resonance: number): number => {
      const filter = new IR3109Filter(SAMPLE_RATE);
      filter.setCutoff(1000);
      filter.setResonance(resonance);
      const sine = makeSine(1000, SAMPLE_RATE);
      return measurePeak(filter, sine);
    };

    const peakNoRes = measureAt(0);
    const peakHighRes = measureAt(3.5);
    expect(peakHighRes).toBeGreaterThan(peakNoRes);
  });

  it('output stays bounded with high resonance + hot input (< 10)', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(1000);
    filter.setResonance(4);

    let maxOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = 10 * Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      const out = Math.abs(filter.process(input));
      if (out > maxOutput) maxOutput = out;
    }
    expect(maxOutput).toBeLessThan(10);
  });

  it('less bass loss than diode ladder — 50Hz sine through 2kHz cutoff with res 3.0, peak > 0.3', () => {
    const filter = new IR3109Filter(SAMPLE_RATE);
    filter.setCutoff(2000);
    filter.setResonance(3.0);

    const sine = makeSine(50, SAMPLE_RATE);
    const peak = measurePeak(filter, sine);
    expect(peak).toBeGreaterThan(0.3);
  });
});
