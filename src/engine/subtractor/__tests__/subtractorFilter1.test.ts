import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('sampleRate', 44100);
vi.stubGlobal('AudioWorkletProcessor', class {});
vi.stubGlobal('registerProcessor', vi.fn());

const SAMPLE_RATE = 44100;

// Dynamically import after stubbing globals
const { SVFFilter } = await import('../subtractorFilter1');

function makeSine(freq: number, numSamples: number): number[] {
  return Array.from({ length: numSamples }, (_, i) =>
    Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
  );
}

function measurePeak(filter: InstanceType<typeof SVFFilter>, signal: number[], settleMs = 500): number {
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

describe('SVFFilter', () => {
  it('LP12 attenuates 5kHz sine with 200Hz cutoff (peak < 0.1)', () => {
    const filter = new SVFFilter(SAMPLE_RATE);
    filter.setCutoff(200);
    filter.setResonance(0);
    filter.setMode(0); // LP12

    const sine = makeSine(5000, SAMPLE_RATE);
    const peak = measurePeak(filter, sine);
    expect(peak).toBeLessThan(0.1);
  });

  it('LP24 attenuates more steeply than LP12 at same settings', () => {
    const signal = makeSine(5000, SAMPLE_RATE);

    const lp12 = new SVFFilter(SAMPLE_RATE);
    lp12.setCutoff(200);
    lp12.setResonance(0);
    lp12.setMode(0); // LP12
    const peakLP12 = measurePeak(lp12, signal);

    const lp24 = new SVFFilter(SAMPLE_RATE);
    lp24.setCutoff(200);
    lp24.setResonance(0);
    lp24.setMode(1); // LP24
    const peakLP24 = measurePeak(lp24, signal);

    expect(peakLP24).toBeLessThan(peakLP12);
  });

  it('HP12 passes high frequencies (5kHz through 200Hz cutoff, peak > 0.5)', () => {
    const filter = new SVFFilter(SAMPLE_RATE);
    filter.setCutoff(200);
    filter.setResonance(0);
    filter.setMode(2); // HP12

    const sine = makeSine(5000, SAMPLE_RATE);
    const peak = measurePeak(filter, sine);
    expect(peak).toBeGreaterThan(0.5);
  });

  it('BP12 passes frequencies near cutoff more than far frequencies', () => {
    const nearCutoff = makeSine(1000, SAMPLE_RATE);
    const farBelow = makeSine(100, SAMPLE_RATE);

    const filterNear = new SVFFilter(SAMPLE_RATE);
    filterNear.setCutoff(1000);
    filterNear.setResonance(0);
    filterNear.setMode(3); // BP12
    const peakNear = measurePeak(filterNear, nearCutoff);

    const filterFar = new SVFFilter(SAMPLE_RATE);
    filterFar.setCutoff(1000);
    filterFar.setResonance(0);
    filterFar.setMode(3); // BP12
    const peakFar = measurePeak(filterFar, farBelow);

    expect(peakNear).toBeGreaterThan(peakFar);
  });

  it('resonance creates peak near cutoff (louder than no resonance)', () => {
    const measure = (resonance: number): number => {
      const filter = new SVFFilter(SAMPLE_RATE);
      filter.setCutoff(1000);
      filter.setResonance(resonance);
      filter.setMode(0); // LP12
      const sine = makeSine(1000, SAMPLE_RATE);
      return measurePeak(filter, sine);
    };

    const peakNoRes = measure(0);
    const peakHighRes = measure(3);
    expect(peakHighRes).toBeGreaterThan(peakNoRes);
  });

  it('output stays bounded with high resonance (< 10)', () => {
    const filter = new SVFFilter(SAMPLE_RATE);
    filter.setCutoff(1000);
    filter.setResonance(4);
    filter.setMode(0);

    let maxOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      const out = Math.abs(filter.process(input));
      if (out > maxOutput) maxOutput = out;
    }
    expect(maxOutput).toBeLessThan(10);
  });
});
