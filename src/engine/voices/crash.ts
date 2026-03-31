import type { VoiceTrigger } from '../types';

// The 909 crash cymbal uses a denser set of metallic partials than the hi-hat,
// with wider frequency spread for a washy, sustaining character
const CRASH_FREQS = [587, 845, 1099, 1397, 1665, 1945, 2363, 2811, 3389, 4185];

export const crash: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0) * 0.35;
  const decayTime = 1.0 + params.decay * 2.0;

  // Highpass to remove low-end rumble from the square waves
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 800;

  // Wide bandpass for the "washy" character
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 4500;
  bandpass.Q.value = 0.4;

  // Crash has a sharp initial transient then long sustain
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel * 1.3, time);
  gain.gain.setValueAtTime(gainLevel, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(gainLevel * 0.3, time + decayTime * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of CRASH_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(highpass);
    osc.start(time);
    osc.stop(time + decayTime + 0.01);
  }
};
