import type { VoiceTrigger } from '../types';

export const rimshot: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const decayTime = 0.02 + params.decay * 0.06;

  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.value = 490;

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 520;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(destination);

  osc1.start(time);
  osc1.stop(time + decayTime);
  osc2.start(time);
  osc2.stop(time + decayTime);
};
