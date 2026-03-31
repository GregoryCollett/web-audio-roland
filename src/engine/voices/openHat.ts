import type { ChokableVoiceTrigger } from '../types';

const HAT_FREQS = [800, 1047, 1480, 1768, 2093, 2637];

export const openHat: ChokableVoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.3;
  const decayTime = 0.2 + params.decay * 0.8;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(gain);
  gain.connect(destination);

  for (const freq of HAT_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(highpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }

  return gain;
};
