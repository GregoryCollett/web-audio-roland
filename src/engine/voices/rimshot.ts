import type { VoiceTrigger } from '../types';

export const rimshot: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0);
  const decayTime = 0.03 + params.decay * 0.08;

  // The 909 rimshot uses two bridged-T oscillators at specific frequencies
  // creating a metallic "ping" character. One lower, one higher.
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.value = 440;

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = 587;

  // Add a noise transient for the "stick hit" attack
  const clickDuration = 0.005;
  const bufferSize = Math.ceil(ctx.sampleRate * clickDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const clickNoise = ctx.createBufferSource();
  clickNoise.buffer = noiseBuffer;

  const clickHP = ctx.createBiquadFilter();
  clickHP.type = 'highpass';
  clickHP.frequency.value = 1500;

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(gainLevel * 0.7, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDuration);

  clickNoise.connect(clickHP);
  clickHP.connect(clickGain);
  clickGain.connect(destination);
  clickNoise.start(time);
  clickNoise.stop(time + clickDuration);

  // Tone body — bandpass to tighten the resonance
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 520;
  bp.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel * 0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc1.connect(bp);
  osc2.connect(bp);
  bp.connect(gain);
  gain.connect(destination);

  osc1.start(time);
  osc1.stop(time + decayTime);
  osc2.start(time);
  osc2.stop(time + decayTime);
};
