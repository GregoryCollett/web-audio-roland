import type { ChokableVoiceTrigger } from '../types';

// Same oscillator bank as closed hat — the 909 uses the same
// generator circuit for both, just with different VCA envelopes
const HAT_FREQS = [800, 1047, 1480, 1768, 2093, 2637];

export const openHat: ChokableVoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0) * 0.4;
  const decayTime = 0.3 + params.decay * 0.9;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 5500;

  // Slightly wider bandpass than closed hat for more body
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 9000;
  bandpass.Q.value = 0.6;

  // Open hat has a sharp attack then a long sustaining decay
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel * 1.1, time);
  gain.gain.setValueAtTime(gainLevel, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(gainLevel * 0.4, time + decayTime * 0.3);
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

  return gain;
};
