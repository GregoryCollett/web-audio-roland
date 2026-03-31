import type { VoiceTrigger } from '../types';

export const clap: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0);
  const decayTime = 0.15 + params.decay * 0.45;

  // The 909 clap is multiple noise bursts through a bandpass filter
  // with a reverb-like tail. The burst timing creates the "multiple hands" effect.
  const totalDuration = decayTime + 0.07;
  const bufferSize = Math.ceil(ctx.sampleRate * totalDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  // The 909 clap filter is centered around 1000-1500Hz with moderate resonance
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1100;
  bandpass.Q.value = 1.8;

  // Second filter stage for more character
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 600;

  const gain = ctx.createGain();

  // The 909 fires 4 rapid bursts with slightly irregular spacing,
  // then a longer reverb-like decay tail
  gain.gain.setValueAtTime(0, time);

  // Burst 1
  gain.gain.setValueAtTime(gainLevel * 0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.007);
  // Burst 2
  gain.gain.setValueAtTime(gainLevel * 0.9, time + 0.009);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.016);
  // Burst 3
  gain.gain.setValueAtTime(gainLevel * 0.85, time + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.025);
  // Burst 4 — slightly louder, leads into tail
  gain.gain.setValueAtTime(gainLevel, time + 0.028);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.035);

  // Reverb-like decay tail
  gain.gain.setValueAtTime(gainLevel * 0.5, time + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04 + decayTime);

  noise.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + totalDuration);
};
