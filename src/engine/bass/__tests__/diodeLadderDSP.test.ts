import { describe, it, expect } from 'vitest';
import { DiodeLadderFilter } from '../diodeLadderDSP';

const SAMPLE_RATE = 44100;

function runFilter(filter: DiodeLadderFilter, signal: number[], settle = 0): number[] {
  // Settle the filter first
  for (let i = 0; i < settle; i++) {
    filter.process(signal[i % signal.length]);
  }
  return signal.map((s) => filter.process(s));
}

describe('DiodeLadderFilter', () => {
  it('passes signal through at max cutoff', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(20000);
    filter.setResonance(0);

    // Feed DC signal and let it settle
    const dc = Array(2000).fill(1.0);
    const output = runFilter(filter, dc);

    // After settling, output should be close to input
    const last = output[output.length - 1];
    expect(last).toBeGreaterThan(0.8);
  });

  it('attenuates signal at low cutoff', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(100);
    filter.setResonance(0);

    // 1kHz sine wave — well above cutoff
    const freq = 1000;
    const numSamples = SAMPLE_RATE; // 1 second
    const sine = Array.from({ length: numSamples }, (_, i) =>
      Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
    );

    // Settle with the signal first
    for (let i = 0; i < SAMPLE_RATE / 2; i++) {
      filter.process(sine[i % sine.length]);
    }

    // Measure peak in the second half
    let peak = 0;
    for (let i = 0; i < numSamples; i++) {
      const out = Math.abs(filter.process(sine[i]));
      if (out > peak) peak = out;
    }

    expect(peak).toBeLessThan(0.1);
  });

  it('creates resonant peak near cutoff', () => {
    const measurePeakAt1kHz = (resonance: number): number => {
      const filter = new DiodeLadderFilter(SAMPLE_RATE);
      filter.setCutoff(1000);
      filter.setResonance(resonance);

      const freq = 1000;
      const sine = Array.from({ length: SAMPLE_RATE }, (_, i) =>
        Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
      );

      // Settle
      for (let i = 0; i < SAMPLE_RATE / 2; i++) {
        filter.process(sine[i % sine.length]);
      }

      let peak = 0;
      for (let i = 0; i < SAMPLE_RATE; i++) {
        const out = Math.abs(filter.process(sine[i]));
        if (out > peak) peak = out;
      }
      return peak;
    };

    const peakNoRes = measurePeakAt1kHz(0);
    const peakHighRes = measurePeakAt1kHz(3.5);

    expect(peakHighRes).toBeGreaterThan(peakNoRes);
  });

  it('soft clips — output stays bounded', () => {
    const filter = new DiodeLadderFilter(SAMPLE_RATE);
    filter.setCutoff(1000);
    filter.setResonance(4);

    // Hot input signal
    let maxOutput = 0;
    for (let i = 0; i < SAMPLE_RATE; i++) {
      const input = 10 * Math.sin(2 * Math.PI * 1000 * i / SAMPLE_RATE);
      const out = Math.abs(filter.process(input));
      if (out > maxOutput) maxOutput = out;
    }

    expect(maxOutput).toBeLessThan(10);
  });
});
