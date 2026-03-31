import type { VoiceTrigger } from '../types';

const RIDE_FREQS = [700, 1100, 1650, 2200, 2900, 3600];

export const ride: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.25;
  const decayTime = 0.4 + params.decay * 0.8;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3500;
  bandpass.Q.value = 1.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of RIDE_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(bandpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }
};
