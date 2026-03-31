import type { VoiceTrigger } from '../types';

// The 909 hi-hat circuit uses 6 square-wave oscillators at specific
// non-harmonic ratios, creating the distinctive metallic character.
// These frequencies approximate the original circuit's tuning.
const HAT_FREQS = [800, 1047, 1480, 1768, 2093, 2637];

export const closedHat: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0) * 0.4;
  const decayTime = 0.025 + params.decay * 0.1;

  // Highpass removes the low-frequency content from the square waves
  // The real 909 uses this around 4-6kHz
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 5500;

  // Bandpass shapes the metallic character — centered in the "sizzle" range
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 10000;
  bandpass.Q.value = 0.8;

  // Two-stage envelope: sharp transient then fast decay
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel * 1.2, time);
  gain.gain.setValueAtTime(gainLevel, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of HAT_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(highpass);
    osc.start(time);
    osc.stop(time + decayTime + 0.01);
  }
};
