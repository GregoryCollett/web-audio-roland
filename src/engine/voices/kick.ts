import type { VoiceTrigger } from '../types';

export const kick: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0);

  const tuneOffset = (params.tune ?? 0.5) - 0.5;
  // 909 kick starts high (~350Hz) and sweeps down to ~45-55Hz
  const startFreq = 350 + tuneOffset * 80;
  const midFreq = 80 + tuneOffset * 20;
  const endFreq = 45 + tuneOffset * 15;
  const decayTime = 0.15 + params.decay * 0.7;

  // Main sine oscillator — the 909's core is a bridged-T oscillator
  // which is essentially a sine with a sharp pitch sweep
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, time);
  // Fast initial sweep (the "click" portion)
  osc.frequency.exponentialRampToValueAtTime(midFreq, time + 0.015);
  // Slower settle to fundamental
  osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.06);

  // Slight waveshaping for that analog warmth — use a subtle overdrive
  const waveShaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    // Soft clipping curve
    curve[i] = (Math.PI / 4) * Math.tanh(x * 1.5);
  }
  waveShaper.curve = curve;
  waveShaper.oversample = '2x';

  // Two-stage amplitude envelope: fast initial punch, then longer body decay
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(gainLevel * 1.2, time);
  oscGain.gain.setValueAtTime(gainLevel, time + 0.01);
  oscGain.gain.exponentialRampToValueAtTime(gainLevel * 0.6, time + decayTime * 0.3);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  osc.connect(waveShaper);
  waveShaper.connect(oscGain);
  oscGain.connect(destination);

  osc.start(time);
  osc.stop(time + decayTime + 0.01);

  // Attack click — short noise burst through a resonant bandpass
  const clickDuration = 0.008;
  const bufferSize = Math.ceil(ctx.sampleRate * clickDuration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3500;
  clickFilter.Q.value = 3;

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(gainLevel * 0.6, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDuration);

  noise.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(destination);

  noise.start(time);
  noise.stop(time + clickDuration);
};
