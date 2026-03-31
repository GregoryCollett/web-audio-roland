import type { VoiceTrigger } from '../types';

function createTom(baseFreq: number): VoiceTrigger {
  return (ctx, destination, time, params, accent) => {
    const gainLevel = params.level * (accent ? 1.4 : 1.0);
    const tuneOffset = (params.tune ?? 0.5) - 0.5;
    const targetFreq = baseFreq + tuneOffset * 40;
    // 909 toms have a more dramatic pitch sweep than simple drums
    const startFreq = targetFreq * 2.5;
    const decayTime = 0.1 + params.decay * 0.35;

    // Main oscillator with pitch envelope
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    // Fast initial drop
    osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.2, time + 0.01);
    // Settle to fundamental
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.04);

    // Two-stage envelope for punchy attack
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(gainLevel * 1.1, time);
    oscGain.gain.setValueAtTime(gainLevel, time + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(gainLevel * 0.3, time + decayTime * 0.5);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(oscGain);
    oscGain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime + 0.01);

    // Noise transient for the stick attack
    const clickDuration = 0.006;
    const bufferSize = Math.ceil(ctx.sampleRate * clickDuration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const click = ctx.createBufferSource();
    click.buffer = noiseBuffer;

    const clickBP = ctx.createBiquadFilter();
    clickBP.type = 'bandpass';
    clickBP.frequency.value = targetFreq * 4;
    clickBP.Q.value = 2;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(gainLevel * 0.4, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDuration);

    click.connect(clickBP);
    clickBP.connect(clickGain);
    clickGain.connect(destination);

    click.start(time);
    click.stop(time + clickDuration);
  };
}

export const lowTom = createTom(110);
