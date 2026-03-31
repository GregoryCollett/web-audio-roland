import type { VoiceTrigger } from '../types';

const CRASH_FREQS = [650, 900, 1200, 1560, 1890, 2400, 2800, 3400, 4100];

export const crash: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0) * 0.25;
  const decayTime = 0.8 + params.decay * 1.5;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 3000;
  bandpass.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of CRASH_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(bandpass);
    osc.start(time);
    osc.stop(time + decayTime);
  }
};
