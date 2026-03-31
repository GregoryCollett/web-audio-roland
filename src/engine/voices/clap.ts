import type { VoiceTrigger } from '../types';

export const clap: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.3 : 1.0);
  const decayTime = 0.1 + params.decay * 0.3;

  const totalDuration = decayTime + 0.04;
  const bufferSize = Math.ceil(ctx.sampleRate * totalDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1200;
  band.Q.value = 1.0;

  const gain = ctx.createGain();

  // Multi-burst envelope: 4 rapid bursts then decay
  gain.gain.setValueAtTime(0, time);
  const burstDuration = 0.01;
  for (let i = 0; i < 4; i++) {
    const burstStart = time + i * burstDuration;
    gain.gain.setValueAtTime(gainLevel, burstStart);
    gain.gain.setValueAtTime(0, burstStart + burstDuration * 0.5);
  }
  const tailStart = time + 4 * burstDuration;
  gain.gain.setValueAtTime(gainLevel * 0.7, tailStart);
  gain.gain.exponentialRampToValueAtTime(0.001, tailStart + decayTime);

  noise.connect(band);
  band.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + totalDuration);
};
