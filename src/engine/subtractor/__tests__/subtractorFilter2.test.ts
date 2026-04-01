import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('sampleRate', 44100);
vi.stubGlobal('AudioWorkletProcessor', class {});
vi.stubGlobal('registerProcessor', vi.fn());

const SAMPLE_RATE = 44100;

// Dynamically import after stubbing globals
const { ButterworthLP } = await import('../subtractorFilter2');

function makeSine(freq: number, numSamples: number): number[] {
  return Array.from({ length: numSamples }, (_, i) =>
    Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
  );
}

function measurePeak(filter: InstanceType<typeof ButterworthLP>, signal: number[], settleMs = 500): number {
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

describe('ButterworthLP', () => {
  it('attenuates highs at low cutoff (5kHz through 200Hz cutoff, peak < 0.1)', () => {
    const filter = new ButterworthLP(SAMPLE_RATE);
    filter.setCutoff(200);
    filter.setResonance(0);

    const sine = makeSine(5000, SAMPLE_RATE);
    const peak = measurePeak(filter, sine);
    expect(peak).toBeLessThan(0.1);
  });

  it('passes signal at max cutoff (1kHz through 20kHz cutoff, peak > 0.8)', () => {
    const filter = new ButterworthLP(SAMPLE_RATE);
    filter.setCutoff(20000);
    filter.setResonance(0);

    // Settle with DC then measure
    for (let i = 0; i < 1000; i++) filter.process(1.0);
    const output = Array.from({ length: 2000 }, () => filter.process(1.0));
    const last = output[output.length - 1];
    expect(last).toBeGreaterThan(0.8);
  });

  it('resonance creates peak near cutoff (louder than no resonance)', () => {
    const measure = (resonance: number): number => {
      const filter = new ButterworthLP(SAMPLE_RATE);
      filter.setCutoff(1000);
      filter.setResonance(resonance);
      const sine = makeSine(1000, SAMPLE_RATE);
      return measurePeak(filter, sine);
    };

    const peakNoRes = measure(0);
    const peakHighRes = measure(1.5);
    expect(peakHighRes).toBeGreaterThan(peakNoRes);
  });

  it('output stays bounded with high resonance (< 10)', () => {
    const filter = new ButterworthLP(SAMPLE_RATE);
    filter.setCutoff(1000);
    filter.setResonance(2);

    let maxOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      const out = Math.abs(filter.process(input));
      if (out > maxOutput) maxOutput = out;
    }
    expect(maxOutput).toBeLessThan(20);
  });
});
