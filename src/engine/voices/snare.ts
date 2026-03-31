import type { VoiceTrigger } from '../types';

export const snare: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0);
  const tuneOffset = (params.tune ?? 0.5) - 0.5;
  const decayTime = 0.15 + params.decay * 0.35;

  // The 909 snare uses two tuned oscillators for the body — one for
  // the fundamental and one slightly higher for the "ring"
  const bodyFreq1 = 189 + tuneOffset * 40;
  const bodyFreq2 = 267 + tuneOffset * 50;

  // Body oscillator 1 — lower fundamental
  const body1 = ctx.createOscillator();
  body1.type = 'sine';
  body1.frequency.setValueAtTime(bodyFreq1, time);

  const body1Gain = ctx.createGain();
  body1Gain.gain.setValueAtTime(gainLevel * 0.55, time);
  body1Gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.45);

  body1.connect(body1Gain);
  body1Gain.connect(destination);
  body1.start(time);
  body1.stop(time + decayTime);

  // Body oscillator 2 — higher ring tone
  const body2 = ctx.createOscillator();
  body2.type = 'sine';
  body2.frequency.setValueAtTime(bodyFreq2, time);

  const body2Gain = ctx.createGain();
  body2Gain.gain.setValueAtTime(gainLevel * 0.35, time);
  body2Gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime * 0.35);

  body2.connect(body2Gain);
  body2Gain.connect(destination);
  body2.start(time);
  body2.stop(time + decayTime);

  // Noise layer — the 909's "snappy" character comes from filtered noise
  // The real circuit uses a noise source through a highpass then a bandpass
  const noiseDuration = decayTime * 1.2;
  const bufferSize = Math.ceil(ctx.sampleRate * noiseDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  // Highpass to remove low-end mud from noise
  const noiseHP = ctx.createBiquadFilter();
  noiseHP.type = 'highpass';
  noiseHP.frequency.value = 2000;

  // Bandpass to shape the noise character
  const noiseBP = ctx.createBiquadFilter();
  noiseBP.type = 'bandpass';
  noiseBP.frequency.value = 4500;
  noiseBP.Q.value = 1.2;

  // Noise envelope — sharp attack, controlled decay
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(gainLevel * 0.7, time);
  noiseGain.gain.setValueAtTime(gainLevel * 0.5, time + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDuration);

  noise.connect(noiseHP);
  noiseHP.connect(noiseBP);
  noiseBP.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(time);
  noise.stop(time + noiseDuration);
};
