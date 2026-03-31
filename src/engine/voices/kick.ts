import type { VoiceTrigger } from '../types';

export const kick: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);

  const tuneOffset = (params.tune ?? 0.5) - 0.5;
  const startFreq = 150 + tuneOffset * 60;
  const endFreq = 50 + tuneOffset * 20;
  const decayTime = 0.1 + params.decay * 0.4;

  // Main sine oscillator with pitch envelope
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, time);
  osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.04);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(gainLevel, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc.connect(oscGain);
  oscGain.connect(destination);

  osc.start(time);
  osc.stop(time + decayTime);

  // Click/attack noise burst
  const bufferSize = Math.ceil(ctx.sampleRate * 0.02);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseBand = ctx.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.value = 100;
  noiseBand.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(gainLevel * 0.4, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

  noise.connect(noiseBand);
  noiseBand.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.02);
};
