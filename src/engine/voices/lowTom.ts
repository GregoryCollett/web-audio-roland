import type { VoiceTrigger } from '../types';

function createTom(baseFreq: number): VoiceTrigger {
  return (ctx, destination, time, params, accent) => {
    const gainLevel = params.level * (accent ? 1.3 : 1.0);
    const tuneOffset = (params.tune ?? 0.5) - 0.5;
    const targetFreq = baseFreq + tuneOffset * 40;
    const startFreq = targetFreq * 1.5;
    const decayTime = 0.08 + params.decay * 0.25;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.03);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime);
  };
}

export const lowTom = createTom(120);
