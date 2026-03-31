import type { VoiceTrigger } from '../types';

export const snare: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const tuneOffset = (params.tune ?? 0.5) - 0.5;
  const bodyFreq = 180 + tuneOffset * 60;
  const decayTime = 0.1 + params.decay * 0.3;

  // Body: tuned triangle oscillator
  const bodyOsc = ctx.createOscillator();
  bodyOsc.type = 'triangle';
  bodyOsc.frequency.setValueAtTime(bodyFreq, time);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(gainLevel * 0.7, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.6);

  bodyOsc.connect(bodyGain);
  bodyGain.connect(destination);

  bodyOsc.start(time);
  bodyOsc.stop(time + decayTime);

  // Noise: bandpass-filtered white noise for snap
  const bufferSize = Math.ceil(ctx.sampleRate * decayTime);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseBand = ctx.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.value = 3000;
  noiseBand.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(gainLevel * 0.6, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  noise.connect(noiseBand);
  noiseBand.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + decayTime);
};
