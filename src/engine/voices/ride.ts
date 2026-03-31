import type { VoiceTrigger } from '../types';

// The 909 ride uses fewer, more focused partials than the crash,
// creating a tighter, more "bell-like" metallic tone
const RIDE_FREQS = [635, 1038, 1580, 2198, 2836, 3540];

export const ride: VoiceTrigger = (ctx, destination, time, params, accent) => {
  const gainLevel = params.level * (accent ? 1.4 : 1.0) * 0.3;
  const decayTime = 0.5 + params.decay * 1.2;

  // Highpass removes low-end content
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 1000;

  // Tighter bandpass than crash for more defined "ping"
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 5000;
  bandpass.Q.value = 0.8;

  // Ride has a pronounced "bell" attack then moderate sustain
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainLevel * 1.5, time);
  gain.gain.exponentialRampToValueAtTime(gainLevel, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(gainLevel * 0.25, time + decayTime * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);

  for (const freq of RIDE_FREQS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(highpass);
    osc.start(time);
    osc.stop(time + decayTime + 0.01);
  }
};
